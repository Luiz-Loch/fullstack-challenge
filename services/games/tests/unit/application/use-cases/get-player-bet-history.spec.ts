import { describe, it, expect, mock } from 'bun:test';
import { GetPlayerBetHistoryUseCase } from '../../../../src/application/use-cases/get-player-bet-history.use-case';
import { Bet } from '../../../../src/domain/bet.entity';
import { Money } from '../../../../src/domain/value-objects/money.vo';

const PLAYER_ID = 'player-uuid';
const ROUND_ID = 'round-uuid';

function makeBet(): Bet {
  return Bet.create(ROUND_ID, PLAYER_ID, Money.of(1_000n));
}

function makeRepository(bets: Bet[], total: number) {
  return { findByPlayerId: mock(() => Promise.resolve({ bets, total })) };
}

describe('GetPlayerBetHistoryUseCase', () => {
  describe('execute()', () => {
    it('returns bets and total from the repository', async () => {
      const bets = [makeBet(), makeBet()];
      const useCase = new GetPlayerBetHistoryUseCase(makeRepository(bets, 20) as any);

      const result = await useCase.execute(PLAYER_ID, 10, 0);

      expect(result.bets).toBe(bets);
      expect(result.total).toBe(20);
    });

    it('forwards playerId, limit and offset to the repository', async () => {
      const repository = makeRepository([], 0);
      const useCase = new GetPlayerBetHistoryUseCase(repository as any);

      await useCase.execute(PLAYER_ID, 25, 50);

      expect(repository.findByPlayerId).toHaveBeenCalledWith(PLAYER_ID, 25, 50);
    });

    it('returns empty array when player has no bets', async () => {
      const useCase = new GetPlayerBetHistoryUseCase(makeRepository([], 0) as any);

      const result = await useCase.execute(PLAYER_ID, 10, 0);

      expect(result.bets).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('does not mix bets from different players', async () => {
      const betsForPlayer = [makeBet()];
      const repository = makeRepository(betsForPlayer, 1);
      const useCase = new GetPlayerBetHistoryUseCase(repository as any);

      await useCase.execute('other-player', 10, 0);

      expect(repository.findByPlayerId).toHaveBeenCalledWith('other-player', 10, 0);
    });

    it('calls the repository exactly once per execute call', async () => {
      const repository = makeRepository([], 0);
      const useCase = new GetPlayerBetHistoryUseCase(repository as any);

      await useCase.execute(PLAYER_ID, 10, 0);

      expect(repository.findByPlayerId).toHaveBeenCalledTimes(1);
    });
  });
});
