import { describe, it, expect, mock } from 'bun:test';
import { GetCurrentRoundUseCase } from '../../../../src/application/use-cases/get-current-round.use-case';
import { Round } from '../../../../src/domain/round.aggregate';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier.vo';
import { RoundStatus } from '../../../../src/domain/enums/round-status.enum';
import type { RoundSnapshot } from '../../../../src/application/round.scheduler';

const ROUND_ID = 'round-uuid';

function makeSnapshot(overrides: Partial<RoundSnapshot> = {}): RoundSnapshot {
  return {
    roundId: ROUND_ID,
    status: RoundStatus.RUNNING,
    multiplier: Multiplier.of(150n),
    serverSeedHash: 'hash-abc',
    ...overrides,
  };
}

function bettingRound(): Round {
  return Round.create(Multiplier.of(200n), 'hash-abc', 'client-seed');
}

function makeRepository(round: Round | null) {
  return {
    findById: mock(() => Promise.resolve(round)),
    save: mock(() => Promise.resolve()),
  };
}

function makeScheduler(snapshot: RoundSnapshot | null) {
  return { getSnapshot: mock(() => snapshot) };
}

describe('GetCurrentRoundUseCase', () => {
  describe('execute()', () => {
    it('returns null when there is no active snapshot', async () => {
      const useCase = new GetCurrentRoundUseCase(
        makeRepository(null) as any,
        makeScheduler(null) as any,
      );

      expect(await useCase.execute()).toBeNull();
    });

    it('does not query the repository when there is no snapshot', async () => {
      const repository = makeRepository(null);
      const useCase = new GetCurrentRoundUseCase(repository as any, makeScheduler(null) as any);

      await useCase.execute();

      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('returns null when the round is not found in the repository', async () => {
      const useCase = new GetCurrentRoundUseCase(
        makeRepository(null) as any,
        makeScheduler(makeSnapshot()) as any,
      );

      expect(await useCase.execute()).toBeNull();
    });

    it('returns snapshot fields merged with bets on success', async () => {
      const snapshot = makeSnapshot();
      const round = bettingRound();
      const useCase = new GetCurrentRoundUseCase(
        makeRepository(round) as any,
        makeScheduler(snapshot) as any,
      );

      const result = await useCase.execute();

      expect(result).not.toBeNull();
      expect(result!.roundId).toBe(snapshot.roundId);
      expect(result!.status).toBe(snapshot.status);
      expect(result!.multiplier).toBe(snapshot.multiplier);
      expect(result!.serverSeedHash).toBe(snapshot.serverSeedHash);
    });

    it('returns the bets from the round aggregate', async () => {
      const round = bettingRound();
      round.placeBet('player-1', Money.of(1000n));
      round.placeBet('player-2', Money.of(2000n));
      const useCase = new GetCurrentRoundUseCase(
        makeRepository(round) as any,
        makeScheduler(makeSnapshot()) as any,
      );

      const result = await useCase.execute();

      expect(result!.bets).toHaveLength(2);
    });

    it('returns empty bets array when round has no bets', async () => {
      const useCase = new GetCurrentRoundUseCase(
        makeRepository(bettingRound()) as any,
        makeScheduler(makeSnapshot()) as any,
      );

      const result = await useCase.execute();

      expect(result!.bets).toHaveLength(0);
    });

    it('queries the repository with the roundId from the snapshot', async () => {
      const repository = makeRepository(bettingRound());
      const snapshot = makeSnapshot({ roundId: 'specific-id' });
      const useCase = new GetCurrentRoundUseCase(repository as any, makeScheduler(snapshot) as any);

      await useCase.execute();

      expect(repository.findById).toHaveBeenCalledWith('specific-id');
    });
  });
});
