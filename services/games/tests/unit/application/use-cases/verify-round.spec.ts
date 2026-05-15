import { describe, it, expect, mock } from 'bun:test';
import { VerifyRoundUseCase } from '../../../../src/application/use-cases/verify-round.use-case';
import { RoundNotCrashedError, RoundNotFoundError } from '../../../../src/domain/errors';
import { Round } from '../../../../src/domain/round.aggregate';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier.vo';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { RoundStatus } from '../../../../src/domain/enums/round-status.enum';

const CRASH_POINT = Multiplier.of(200n);
const SERVER_SEED = 'server-seed-abc';
const CLIENT_SEED = 'client-seed-xyz';

function makeProvablyFair(verified: boolean) {
  return { verify: mock(() => verified) };
}

function makeRepository(round: Round | null) {
  return { findById: mock(() => Promise.resolve(round)) };
}

function crashedRound(): Round {
  const round = Round.create(CRASH_POINT, 'seed-hash', CLIENT_SEED);
  round.start();
  round.crash(SERVER_SEED);
  return round;
}

function bettingRound(): Round {
  return Round.create(CRASH_POINT, 'seed-hash', CLIENT_SEED);
}

function runningRound(): Round {
  const round = Round.create(CRASH_POINT, 'seed-hash', CLIENT_SEED);
  round.placeBet('player-1', Money.of(1000n));
  round.start();
  return round;
}

describe('VerifyRoundUseCase', () => {
  describe('execute()', () => {
    it('throws RoundNotFoundError when round does not exist', async () => {
      const useCase = new VerifyRoundUseCase(makeRepository(null) as any, makeProvablyFair(true) as any);

      expect(useCase.execute('unknown-id')).rejects.toBeInstanceOf(RoundNotFoundError);
    });

    it('throws RoundNotCrashedError when round is in BETTING state', async () => {
      const useCase = new VerifyRoundUseCase(makeRepository(bettingRound()) as any, makeProvablyFair(true) as any);

      expect(useCase.execute('any-id')).rejects.toBeInstanceOf(RoundNotCrashedError);
    });

    it('throws RoundNotCrashedError when round is in RUNNING state', async () => {
      const useCase = new VerifyRoundUseCase(makeRepository(runningRound()) as any, makeProvablyFair(true) as any);

      expect(useCase.execute('any-id')).rejects.toBeInstanceOf(RoundNotCrashedError);
    });

    it('returns verified=true when provably fair check passes', async () => {
      const useCase = new VerifyRoundUseCase(makeRepository(crashedRound()) as any, makeProvablyFair(true) as any);

      const result = await useCase.execute('any-id');

      expect(result.verified).toBe(true);
    });

    it('returns verified=false when provably fair check fails', async () => {
      const useCase = new VerifyRoundUseCase(makeRepository(crashedRound()) as any, makeProvablyFair(false) as any);

      const result = await useCase.execute('any-id');

      expect(result.verified).toBe(false);
    });

    it('returns all provably fair fields', async () => {
      const round = crashedRound();
      const useCase = new VerifyRoundUseCase(makeRepository(round) as any, makeProvablyFair(true) as any);

      const result = await useCase.execute(round.id);

      expect(result.roundId).toBe(round.id);
      expect(result.serverSeed).toBe(SERVER_SEED);
      expect(result.serverSeedHash).toBe(round.serverSeedHash);
      expect(result.clientSeed).toBe(CLIENT_SEED);
      expect(result.crashPointCentesimals).toBe(CRASH_POINT.centesimals);
    });

    it('calls provably fair verify with the correct arguments', async () => {
      const round = crashedRound();
      const provablyFair = makeProvablyFair(true);
      const useCase = new VerifyRoundUseCase(makeRepository(round) as any, provablyFair as any);

      await useCase.execute(round.id);

      expect(provablyFair.verify).toHaveBeenCalledWith(
        SERVER_SEED,
        CLIENT_SEED,
        round.serverSeedHash,
        round.crashPoint,
      );
    });

    it('queries the repository with the provided roundId', async () => {
      const repository = makeRepository(null);
      const useCase = new VerifyRoundUseCase(repository as any, makeProvablyFair(true) as any);

      await useCase.execute('specific-id').catch(() => {});

      expect(repository.findById).toHaveBeenCalledWith('specific-id');
    });
  });
});
