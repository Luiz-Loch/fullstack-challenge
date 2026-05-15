import { describe, it, expect, mock } from 'bun:test';
import { GetRoundHistoryUseCase } from '../../../../src/application/use-cases/get-round-history.use-case';
import { Round } from '../../../../src/domain/round.aggregate';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier.vo';

function makeRound(): Round {
  return Round.create(Multiplier.of(200n), 'seed-hash', 'client-seed');
}

function makeRepository(rounds: Round[], total: number) {
  return { findHistory: mock(() => Promise.resolve({ rounds, total })) };
}

describe('GetRoundHistoryUseCase', () => {
  describe('execute()', () => {
    it('returns rounds and total from the repository', async () => {
      const rounds = [makeRound(), makeRound()];
      const useCase = new GetRoundHistoryUseCase(makeRepository(rounds, 10) as any);

      const result = await useCase.execute(10, 0);

      expect(result.rounds).toBe(rounds);
      expect(result.total).toBe(10);
    });

    it('forwards limit and offset to the repository', async () => {
      const repository = makeRepository([], 0);
      const useCase = new GetRoundHistoryUseCase(repository as any);

      await useCase.execute(25, 50);

      expect(repository.findHistory).toHaveBeenCalledWith(25, 50);
    });

    it('returns empty array when there are no rounds', async () => {
      const useCase = new GetRoundHistoryUseCase(makeRepository([], 0) as any);

      const result = await useCase.execute(10, 0);

      expect(result.rounds).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
