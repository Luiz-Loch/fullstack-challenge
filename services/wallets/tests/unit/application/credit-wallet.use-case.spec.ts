import { describe, it, expect, mock } from 'bun:test';
import { NotFoundException } from '@nestjs/common';
import { CreditWalletUseCase } from '../../../src/application/use-cases/credit-wallet.use-case';
import { Wallet } from '../../../src/domain/wallet.aggregate';

const PLAYER_ID = 'player-uuid';

function walletWith(balanceCents: bigint): Wallet {
  return Wallet.reconstitute('wallet-uuid', PLAYER_ID, balanceCents);
}

function makeRepository(wallet: Wallet | null) {
  return {
    findByPlayerId: mock(() => Promise.resolve(wallet)),
    findById: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
  };
}

describe('CreditWalletUseCase', () => {
  describe('when wallet exists', () => {
    it('increases the balance by the credited amount', async () => {
      const repo = makeRepository(walletWith(1000n));
      const useCase = new CreditWalletUseCase(repo as any);

      await useCase.execute({ playerId: PLAYER_ID, amountCents: 500n });

      const saved: Wallet = repo.save.mock.calls[0][0];
      expect(saved.balance.amount).toBe(1500n);
    });

    it('saves the wallet exactly once', async () => {
      const repo = makeRepository(walletWith(0n));
      const useCase = new CreditWalletUseCase(repo as any);

      await useCase.execute({ playerId: PLAYER_ID, amountCents: 200n });

      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('credits to a wallet with zero balance', async () => {
      const repo = makeRepository(walletWith(0n));
      const useCase = new CreditWalletUseCase(repo as any);

      await useCase.execute({ playerId: PLAYER_ID, amountCents: 300n });

      const saved: Wallet = repo.save.mock.calls[0][0];
      expect(saved.balance.amount).toBe(300n);
    });
  });

  describe('when wallet does not exist', () => {
    it('throws NotFoundException', async () => {
      const useCase = new CreditWalletUseCase(makeRepository(null) as any);

      expect(useCase.execute({ playerId: PLAYER_ID, amountCents: 500n }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('does not call save', async () => {
      const repo = makeRepository(null);
      const useCase = new CreditWalletUseCase(repo as any);

      await useCase.execute({ playerId: PLAYER_ID, amountCents: 500n }).catch(() => {});

      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});