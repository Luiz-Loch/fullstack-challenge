import { describe, it, expect, mock } from 'bun:test';
import { NotFoundException } from '@nestjs/common';
import { GetMyWalletUseCase } from '../../../src/application/use-cases/get-my-wallet.use-case';
import { Wallet } from '../../../src/domain/wallet.aggregate';

const PLAYER_ID = 'player-uuid';
const BALANCE = 5000n;

function existingWallet(): Wallet {
  return Wallet.reconstitute('wallet-uuid', PLAYER_ID, BALANCE);
}

function makeRepository(wallet: Wallet | null = null) {
  return {
    findByPlayerId: mock(() => Promise.resolve(wallet)),
    findById: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
  };
}

describe('GetMyWalletUseCase', () => {
  describe('when wallet exists', () => {
    it('returns the wallet', async () => {
      const wallet = existingWallet();
      const repo = makeRepository(wallet);
      const useCase = new GetMyWalletUseCase(repo as any);

      const result = await useCase.execute(PLAYER_ID);

      expect(result).toBe(wallet);
    });

    it('queries by the given playerId', async () => {
      const repo = makeRepository(existingWallet());
      const useCase = new GetMyWalletUseCase(repo as any);

      await useCase.execute(PLAYER_ID);

      expect(repo.findByPlayerId).toHaveBeenCalledWith(PLAYER_ID);
    });
  });

  describe('when wallet does not exist', () => {
    it('throws NotFoundException', async () => {
      const repo = makeRepository(null);
      const useCase = new GetMyWalletUseCase(repo as any);

      expect(useCase.execute(PLAYER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
