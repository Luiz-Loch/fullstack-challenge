import { ConflictException, Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { type IBetRepository, BET_REPOSITORY } from '@/domain/ports/bet.repository';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { Money } from '@/domain/value-objects/money.vo';
import { WalletClient } from '@/infrastructure/messaging/wallet.client';

export interface PlaceBetCommand {
  roundId: string;
  playerId: string;
  username: string;
  amountCents: bigint;
}

export interface PlaceBetResult {
  betId: string;
  roundId: string;
  amountCents: bigint;
  placedAt: Date;
}

@Injectable()
export class PlaceBetUseCase {
  private readonly logger = new Logger(PlaceBetUseCase.name);

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    @Inject(BET_REPOSITORY)
    private readonly betRepository: IBetRepository,
    private readonly walletClient: WalletClient,
  ) { }

  async execute(command: PlaceBetCommand): Promise<PlaceBetResult> {
    this.logger.log(`Placing bet: player=${command.playerId} amount=${command.amountCents}`);

    const round = await this.roundRepository.findById(command.roundId);
    if (!round) {
      this.logger.warn(`Round not found for placing bet: player=${command.playerId}, roundId=${command.roundId}`);
      throw new NotFoundException(`Round not found`);
    }

    try {
      const bet = round.placeBet(command.playerId, command.username, Money.of(command.amountCents));

      const debit = await this.walletClient.sendBetPlaced(command.playerId, command.amountCents);
      if (!debit.success) {
        this.logger.warn(`Wallet debit failed: player=${command.playerId} reason=${debit.message}`);
        throw new UnprocessableEntityException(debit.message ?? 'Insufficient balance');
      }

      await this.betRepository.save(bet);
      this.logger.log(`Bet placed: bet=${bet.id} player=${command.playerId} round=${round.id}`);

      return {
        betId: bet.id,
        roundId: round.id,
        amountCents: bet.amount.amount,
        placedAt: bet.placedAt,
      };
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already has a bet')) {
        throw new ConflictException(message);
      }
      throw new UnprocessableEntityException(message);
    }
  }

}