import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Wallet } from '@/domain/wallet.entity';
import { WALLET_REPOSITORY } from '@/domain/ports/wallet.repository';
import type { IWalletRepository } from '@/domain/ports/wallet.repository';

/** Retrieves the wallet of the authenticated player. */
@Injectable()
export class GetMyWalletUseCase {
  private readonly logger = new Logger(GetMyWalletUseCase.name);

  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  /**
   * @param playerId - Keycloak subject (`sub`) of the authenticated player.
   * @returns The player's {@link Wallet}.
   * @throws {NotFoundException} If no wallet exists for this player.
   */
  async execute(playerId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      this.logger.warn(`Wallet not found for player ${playerId}`);
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

}
