import { describe, it, expect, mock } from 'bun:test';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PlaceBetUseCase } from '../../../../src/application/use-cases/place-bet.use-case';
import { Round } from '../../../../src/domain/round.aggregate';
import { Money } from '../../../../src/domain/value-objects/money.vo';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier.vo';

const PLAYER_ID = 'player-uuid';
const AMOUNT = 1000n;

function bettingRound(): Round {
  return Round.create(Multiplier.of(200n), 'seed-hash', 'client-seed');
}

function makeRoundRepository(round: Round | null) {
  return {
    findById: mock(() => Promise.resolve(round)),
    save: mock(() => Promise.resolve()),
  };
}

function makeBetRepository() {
  return { save: mock(() => Promise.resolve()) };
}

describe('PlaceBetUseCase', () => {
  describe('execute()', () => {
    it('returns bet data when round is in BETTING state', async () => {
      const round = bettingRound();
      const useCase = new PlaceBetUseCase(makeRoundRepository(round) as any, makeBetRepository() as any);

      const result = await useCase.execute({ roundId: round.id, playerId: PLAYER_ID, amountCents: AMOUNT });

      expect(result.roundId).toBe(round.id);
      expect(result.betId).toBeString();
      expect(result.placedAt).toBeInstanceOf(Date);
    });

    it('persists the bet via bet repository', async () => {
      const round = bettingRound();
      const betRepository = makeBetRepository();
      const useCase = new PlaceBetUseCase(makeRoundRepository(round) as any, betRepository as any);

      await useCase.execute({ roundId: round.id, playerId: PLAYER_ID, amountCents: AMOUNT });

      expect(betRepository.save).toHaveBeenCalledTimes(1);
    });

    it('does not persist when round is not found', async () => {
      const betRepository = makeBetRepository();
      const useCase = new PlaceBetUseCase(makeRoundRepository(null) as any, betRepository as any);

      await useCase.execute({ roundId: 'unknown-id', playerId: PLAYER_ID, amountCents: AMOUNT }).catch(() => {});

      expect(betRepository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when round is not found', async () => {
      const useCase = new PlaceBetUseCase(makeRoundRepository(null) as any, makeBetRepository() as any);

      expect(useCase.execute({ roundId: 'unknown-id', playerId: PLAYER_ID, amountCents: AMOUNT }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnprocessableEntityException when round is not in BETTING state', async () => {
      const round = bettingRound();
      round.placeBet(PLAYER_ID, Money.of(AMOUNT));
      round.start();
      const useCase = new PlaceBetUseCase(makeRoundRepository(round) as any, makeBetRepository() as any);

      expect(useCase.execute({ roundId: round.id, playerId: 'other-player', amountCents: AMOUNT }))
        .rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws ConflictException when player already has a bet in the round', async () => {
      const round = bettingRound();
      round.placeBet(PLAYER_ID, Money.of(AMOUNT));
      const useCase = new PlaceBetUseCase(makeRoundRepository(round) as any, makeBetRepository() as any);

      expect(useCase.execute({ roundId: round.id, playerId: PLAYER_ID, amountCents: AMOUNT }))
        .rejects.toBeInstanceOf(ConflictException);
    });
  });
});
