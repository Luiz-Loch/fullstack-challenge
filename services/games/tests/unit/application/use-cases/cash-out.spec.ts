import { describe, it, expect, mock } from 'bun:test';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CashOutUseCase } from '../../../../src/application/use-cases/cash-out.use-case';
import { Round } from '../../../../src/domain/round.aggregate';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier.vo';

const PLAYER_ID = 'player-uuid';
const AMOUNT = 1000n;
const MULTIPLIER = Multiplier.of(200n);

function runningRoundWithBet(playerId = PLAYER_ID): Round {
  const round = Round.create(Multiplier.of(300n), 'seed-hash', 'client-seed');
  round.placeBet(playerId, Money.of(AMOUNT));
  round.start();
  return round;
}

function makeRoundRepository(round: Round | null) {
  return { findById: mock(() => Promise.resolve(round)), save: mock(() => Promise.resolve()) };
}

function makeBetRepository() {
  return { save: mock(() => Promise.resolve()) };
}

function makeUseCase(round: Round | null) {
  return new CashOutUseCase(makeRoundRepository(round) as any, makeBetRepository() as any);
}

describe('CashOutUseCase', () => {
  describe('execute()', () => {
    it('returns payout data when round is RUNNING and player has a bet', async () => {
      const round = runningRoundWithBet();
      const useCase = makeUseCase(round);

      const result = await useCase.execute({ roundId: round.id, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER });

      expect(result.roundId).toBe(round.id);
      expect(result.betId).toBeString();
      expect(result.payoutCents.amount).toBe((AMOUNT * MULTIPLIER.centesimals) / 100n);
      expect(result.cashedOutAt).toBeInstanceOf(Date);
    });

    it('persists the bet via bet repository', async () => {
      const round = runningRoundWithBet();
      const betRepository = makeBetRepository();
      const useCase = new CashOutUseCase(makeRoundRepository(round) as any, betRepository as any);

      await useCase.execute({ roundId: round.id, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER });

      expect(betRepository.save).toHaveBeenCalledTimes(1);
    });

    it('does not persist when round is not found', async () => {
      const betRepository = makeBetRepository();
      const useCase = new CashOutUseCase(makeRoundRepository(null) as any, betRepository as any);

      await useCase.execute({ roundId: 'unknown-id', playerId: PLAYER_ID, currentMultiplier: MULTIPLIER }).catch(() => {});

      expect(betRepository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when round is not found', async () => {
      const roundId = 'unknown-id';
      const useCase = makeUseCase(null);

      expect(useCase.execute({ roundId, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnprocessableEntityException when round is in BETTING state', async () => {
      const round = Round.create(Multiplier.of(300n), 'seed-hash', 'client-seed');
      round.placeBet(PLAYER_ID, Money.of(AMOUNT));
      const useCase = makeUseCase(round);

      expect(useCase.execute({ roundId: round.id, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER }))
        .rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when player has no pending bet', async () => {
      const round = runningRoundWithBet('other-player');
      const useCase = makeUseCase(round);

      expect(useCase.execute({ roundId: round.id, playerId: PLAYER_ID, currentMultiplier: MULTIPLIER }))
        .rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });
});
