import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type IWalletRepository, WALLET_REPOSITORY } from '@/domain/ports/wallet.repository';
import { Money } from '@/domain/value-objects/money.vo';

export interface CreditWalletCommand {
  playerId: string;
  amountCents: bigint;
}

/** Credits a player's wallet with amountCents. */
@Injectable()
export class CreditWalletUseCase {
  private readonly logger = new Logger(CreditWalletUseCase.name);

  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  /**
   * Finds the player's wallet and credits the given amount.
   *
   * @param command.playerId - Keycloak subject (`sub`) of the player to credit.
   * @param command.amountCents - Payout amount in cents (bet × multiplier).
   * @throws {NotFoundException} If no wallet exists for the given player.
   */
  async execute(command: CreditWalletCommand): Promise<void> {
    const wallet = await this.walletRepository.findByPlayerId(command.playerId);
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for player ${command.playerId}`);
    }

    wallet.credit(Money.of(command.amountCents));
    await this.walletRepository.save(wallet);
    this.logger.log(`Credited ${command.amountCents} to player=${command.playerId}`);
  }
}