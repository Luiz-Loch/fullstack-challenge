import { describe, it, expect, mock } from 'bun:test';
import { ConflictException } from '@nestjs/common';
import { CreateWalletUseCase } from '../../../src/application/use-cases/create-wallet.use-case';
import { Wallet } from '../../../src/domain/wallet.aggregate';

const PLAYER_ID = 'player-uuid';

function existingWallet(): Wallet {
  return Wallet.reconstitute('wallet-uuid', PLAYER_ID, 0n);
}

function makeRepository(wallet: Wallet | null = null) {
  return {
    findByPlayerId: mock(() => Promise.resolve(wallet)),
    findById: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
  };
}

describe('CreateWalletUseCase', () => {
  describe('when player has no wallet', () => {
    it('returns a wallet with the correct playerId', async () => {
      const repo = makeRepository();
      const useCase = new CreateWalletUseCase(repo as any);

      const result = await useCase.execute(PLAYER_ID);

      expect(result.playerId).toBe(PLAYER_ID);
    });

    it('returns a wallet with zero balance', async () => {
      const repo = makeRepository();
      const useCase = new CreateWalletUseCase(repo as any);

      const result = await useCase.execute(PLAYER_ID);

      expect(result.balance.amount).toBe(0n);
    });

    it('saves the wallet to the repository', async () => {
      const repo = makeRepository();
      const useCase = new CreateWalletUseCase(repo as any);

      await useCase.execute(PLAYER_ID);

      expect(repo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('when player already has a wallet', () => {
    it('throws ConflictException', async () => {
      const repo = makeRepository(existingWallet());
      const useCase = new CreateWalletUseCase(repo as any);

      expect(useCase.execute(PLAYER_ID)).rejects.toThrow(ConflictException);
    });

    it('does not call save', async () => {
      const repo = makeRepository(existingWallet());
      const useCase = new CreateWalletUseCase(repo as any);

      await useCase.execute(PLAYER_ID).catch(() => {});

      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
