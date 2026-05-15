import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { Wallet } from '@/domain/wallet.aggregate';

import { WALLET_REPOSITORY } from '@/domain/ports/wallet.repository';
import type { IWalletRepository } from '@/domain/ports/wallet.repository';

/** Creates a wallet for a player if one does not already exist. */
@Injectable()
export class CreateWalletUseCase {
  private readonly logger = new Logger(CreateWalletUseCase.name);

  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  /**
   * @param playerId - Keycloak subject (`sub`) of the authenticated player.
   * @returns The newly created {@link Wallet}.
   * @throws {ConflictException} If a wallet already exists for this player.
   */
  async execute(playerId: string): Promise<Wallet> {
    const existing = await this.walletRepository.findByPlayerId(playerId);
    if (existing) {
      this.logger.warn(`Wallet already exists for player ${playerId}`);
      throw new ConflictException('Wallet already exists for this player');
    }

    const wallet = Wallet.create(playerId);
    await this.walletRepository.save(wallet);
    this.logger.log(`Wallet ${wallet.id} created for player ${playerId}`);
    return wallet;
  }

}
