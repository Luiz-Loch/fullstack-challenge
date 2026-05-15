import { describe, it, expect, mock } from 'bun:test';
import { CashOutUseCase } from '../../../../src/application/use-cases/cash-out.use-case';
import { Round } from '../../../../src/domain/round.aggregate';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier.vo';

const PLAYER_ID = 'player-uuid';
const AMOUNT = 1000n;
const MULTIPLIER = 200n;

function runningRoundWithBet(playerId = PLAYER_ID): Round {
  const round = Round.create(Multiplier.of(300n), 'seed-hash', 'client-seed');
  round.placeBet(playerId, Money.of(AMOUNT));
  round.start();
  return round;
}

function makeRepository(round: Round | null) {
  return {
    findById: mock(() => Promise.resolve(round)),
    save: mock(() => Promise.resolve()),
  };
}

describe('CashOutUseCase', () => {
  describe('execute()', () => {
    it('returns payout data when round is RUNNING and player has a bet', async () => {
      const round = runningRoundWithBet();
      const repository = makeRepository(round);
      const useCase = new CashOutUseCase(repository as any);

      const result = await useCase.execute({ roundId: round.id, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER });

      expect(result.roundId).toBe(round.id);
      expect(result.betId).toBeString();
      expect(result.payoutCents).toBe((AMOUNT * MULTIPLIER) / 100n);
      expect(result.cashedOutAt).toBeInstanceOf(Date);
    });

    it('persists the round after cash out', async () => {
      const round = runningRoundWithBet();
      const repository = makeRepository(round);
      const useCase = new CashOutUseCase(repository as any);

      await useCase.execute({ roundId: round.id, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER });

      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('throws when round is not found', async () => {
      const roundId = 'unknown-id';
      const repository = makeRepository(null);
      const useCase = new CashOutUseCase(repository as any);

      expect(useCase.execute({ roundId, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER }))
        .rejects.toThrow(`Round ${roundId} not found`);
    });

    it('does not persist when round is not found', async () => {
      const repository = makeRepository(null);
      const useCase = new CashOutUseCase(repository as any);

      await useCase.execute({ roundId: 'unknown-id', playerId: PLAYER_ID, currentMultiplier: MULTIPLIER }).catch(() => { });

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('throws when round is in BETTING state', async () => {
      const round = Round.create(Multiplier.of(200n), 'seed-hash', 'client-seed');
      round.placeBet(PLAYER_ID, Money.of(AMOUNT));
      const repository = makeRepository(round);
      const useCase = new CashOutUseCase(repository as any);

      expect(useCase.execute({ roundId: round.id, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER }))
        .rejects.toThrow('Cash outs are only accepted during the RUNNING phase');
    });

    it('throws when player has no active bet in the round', async () => {
      const round = runningRoundWithBet('other-player');
      const repository = makeRepository(round);
      const useCase = new CashOutUseCase(repository as any);

      expect(useCase.execute({ roundId: round.id, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER }))
        .rejects.toThrow('No active bet found for player in this round');
    });
  });
});