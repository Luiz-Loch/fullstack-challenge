import { describe, it, expect } from 'bun:test';
import { Bet } from '../../../src/domain/bet.entity';
import { Money } from '../../../src/domain/value-objects/money.vo';
import { Multiplier } from '../../../src/domain/value-objects/multiplier.vo';
import { BetStatus } from '../../../src/domain/enums/bet-status.enum';

const ROUND_ID = 'round-1';
const PLAYER_ID = 'player-1';
const validAmount = Money.of(1_000n); // R$ 10,00

describe('Bet', () => {
  describe('create()', () => {
    it('creates a PENDING bet with the given amount', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      expect(bet.status).toBe(BetStatus.PENDING);
      expect(bet.amount.amount).toBe(1000n);
      expect(bet.payout).toBeNull();
    });

    it('assigns the given roundId and playerId', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      expect(bet.roundId).toBe(ROUND_ID);
      expect(bet.playerId).toBe(PLAYER_ID);
    });

    it('generates a unique id', () => {
      const a = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      const b = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      expect(a.id).not.toBe(b.id);
    });

    it('throws when amount is below minimum (100n cents)', () => {
      expect(() => Bet.create(ROUND_ID, PLAYER_ID, Money.of(99n))).toThrow();
    });

    it('allows exactly the minimum bet (100n cents)', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, Money.of(100n));
      expect(bet.amount.amount).toBe(100n);
    });

    it('throws when amount exceeds maximum (100_000n cents)', () => {
      expect(() => Bet.create(ROUND_ID, PLAYER_ID, Money.of(100_001n))).toThrow();
    });

    it('allows exactly the maximum bet (100_000n cents)', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, Money.of(100_000n));
      expect(bet.amount.amount).toBe(100_000n);
    });
  });

  describe('reconstitute()', () => {
    it('restores a CASHED_OUT bet with its payout', () => {
      const bet = Bet.reconstitute('id-1', ROUND_ID, PLAYER_ID, 1000n, BetStatus.CASHED_OUT, 2350n, new Date(), new Date());
      expect(bet.status).toBe(BetStatus.CASHED_OUT);
      expect(bet.payout!.amount).toBe(2350n);
    });

    it('restores a LOST bet with payout 0', () => {
      const bet = Bet.reconstitute('id-1', ROUND_ID, PLAYER_ID, 1000n, BetStatus.LOST, 0n, null, new Date());
      expect(bet.status).toBe(BetStatus.LOST);
      expect(bet.payout!.amount).toBe(0n);
    });
  });

  describe('cashOut()', () => {
    it('calculates payout as integer arithmetic without floats', () => {
      // R$10,00 × 2.35x = R$23,50 → (1000n × 235n) / 100n = 2350n
      const bet = Bet.create(ROUND_ID, PLAYER_ID, Money.of(1000n));
      bet.cashOut(Multiplier.of(235n));
      expect(bet.payout!.amount).toBe(2350n);
    });

    it('calculates payout at exactly 1.00x (returns the original amount)', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, Money.of(1000n));
      bet.cashOut(Multiplier.of(100n));
      expect(bet.payout!.amount).toBe(1000n);
    });

    it('transitions status to CASHED_OUT', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      bet.cashOut(Multiplier.of(200n));
      expect(bet.status).toBe(BetStatus.CASHED_OUT);
    });

    it('sets cashedOutAt', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      bet.cashOut(Multiplier.of(200n));
      expect(bet.cashedOutAt).toBeInstanceOf(Date);
    });

    it('throws when bet is not PENDING', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      bet.cashOut(Multiplier.of(200n));
      expect(() => bet.cashOut(Multiplier.of(300n))).toThrow('Only pending bets can be cashed out');
    });
  });

  describe('lose()', () => {
    it('transitions status to LOST', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      bet.lose();
      expect(bet.status).toBe(BetStatus.LOST);
    });

    it('sets payout to 0', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      bet.lose();
      expect(bet.payout!.amount).toBe(0n);
    });

    it('throws when bet is not PENDING', () => {
      const bet = Bet.create(ROUND_ID, PLAYER_ID, validAmount);
      bet.lose();
      expect(() => bet.lose()).toThrow('Only pending bets can be marked as lost');
    });
  });
});
