import { describe, it, expect, mock } from 'bun:test';
import { PlaceBetUseCase } from '../../../src/application/use-cases/place-bet.use-case';
import { Round } from '../../../src/domain/round.aggregate';
import { Money } from '../../../src/domain/value-objects/money.vo';
import { Multiplier } from '../../../src/domain/value-objects/multiplier.vo';

const PLAYER_ID = 'player-uuid';
const AMOUNT = 1000n;

function bettingRound(): Round {
  return Round.create(Multiplier.of(200n), 'seed-hash', 'client-seed');
}

function makeRepository(round: Round | null) {
  return {
    findById: mock(() => Promise.resolve(round)),
    save: mock(() => Promise.resolve()),
  };
}

describe('PlaceBetUseCase', () => {
  describe('execute()', () => {
    it('returns bet data when round is in BETTING state', async () => {
      const round = bettingRound();
      const repository = makeRepository(round);
      const useCase = new PlaceBetUseCase(repository as any);

      const result = await useCase.execute({ roundId: round.id, playerId: PLAYER_ID, amountCents: AMOUNT });

      expect(result.roundId).toBe(round.id);
      expect(result.amountCents).toBe(AMOUNT);
      expect(result.betId).toBeString();
      expect(result.placedAt).toBeInstanceOf(Date);
    });

    it('persists the round after placing the bet', async () => {
      const round = bettingRound();
      const repository = makeRepository(round);
      const useCase = new PlaceBetUseCase(repository as any);

      await useCase.execute({ roundId: round.id, playerId: PLAYER_ID, amountCents: AMOUNT });

      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('throws when round is not found', async () => {
      const roundId = 'unknown-id';
      const repository = makeRepository(null);
      const useCase = new PlaceBetUseCase(repository as any);

      expect(useCase.execute({ roundId, playerId: PLAYER_ID, amountCents: AMOUNT }))
        .rejects.toThrow(`Round ${roundId} not found`);
    });

    it('does not persist when round is not found', async () => {
      const repository = makeRepository(null);
      const useCase = new PlaceBetUseCase(repository as any);

      await useCase.execute({ roundId: 'unknown-id', playerId: PLAYER_ID, amountCents: AMOUNT }).catch(() => {});

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('throws when round is not in BETTING state', async () => {
      const round = bettingRound();
      round.placeBet(PLAYER_ID, Money.of(AMOUNT));
      round.start();
      const repository = makeRepository(round);
      const useCase = new PlaceBetUseCase(repository as any);

      expect(useCase.execute({ roundId: round.id, playerId: 'other-player', amountCents: AMOUNT }))
        .rejects.toThrow('Bets are only accepted during the BETTING phase');
    });

    it('throws when player already has a bet in the round', async () => {
      const round = bettingRound();
      round.placeBet(PLAYER_ID, Money.of(AMOUNT));
      const repository = makeRepository(round);
      const useCase = new PlaceBetUseCase(repository as any);

      expect(useCase.execute({ roundId: round.id, playerId: PLAYER_ID, amountCents: AMOUNT }))
        .rejects.toThrow('Player already has a bet in this round');
    });
  });
});