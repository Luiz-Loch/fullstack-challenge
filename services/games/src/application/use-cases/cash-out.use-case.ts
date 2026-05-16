import { Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { type IBetRepository, BET_REPOSITORY } from '@/domain/ports/bet.repository';
import { Money } from '@/domain';

export interface CashOutCommand {
  roundId: string;
  playerId: string;
  currentMultiplier: Multiplier;
}

export interface CashOutResult {
  betId: string;
  roundId: string;
  payoutCents: Money;
  cashedOutAt: Date;
}

/**
 * Processes a player's cash-out request during a RUNNING round.
 *
 * Delegates the payout calculation to the Round aggregate (which multiplies
 * the bet amount by the current multiplier), then persists only the affected Bet.
 * The Round itself is not re-saved here — crash and status transitions are
 * owned by RoundScheduler.
 */
@Injectable()
export class CashOutUseCase {
  private readonly logger = new Logger(CashOutUseCase.name);

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    @Inject(BET_REPOSITORY)
    private readonly betRepository: IBetRepository,
  ) { }

  /**
   * Cashes out the player's pending bet at the given multiplier snapshot.
   *
   * @param command.roundId - ID of the active round.
   * @param command.playerId - ID of the player requesting the cash-out.
   * @param command.currentMultiplier - Multiplier snapshot captured by the game loop at request time.
   * @throws {NotFoundException} If the round does not exist.
   * @throws {UnprocessableEntityException} If the round is not RUNNING or the player has no pending bet.
   */
  async execute(command: CashOutCommand): Promise<CashOutResult> {
    this.logger.log(`Cashing out: player=${command.playerId} round=${command.roundId} multiplier=${command.currentMultiplier}`);

    const round = await this.roundRepository.findById(command.roundId);
    if (!round) {
      this.logger.warn(`Round not found: ${command.roundId}`);
      throw new NotFoundException(`Round ${command.roundId} not found`);
    }

    try {
      const bet = round.processCashOut(
        command.playerId,
        command.currentMultiplier,
      );
      await this.betRepository.save(bet);

      this.logger.log(`Cash out processed: bet=${bet.id} player=${command.playerId} payout=${bet.payout!.amount}`);

      return {
        betId: bet.id,
        roundId: round.id,
        payoutCents: bet.payout!,
        cashedOutAt: bet.cashedOutAt!,
      };

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new UnprocessableEntityException(message);
    }
  }

}