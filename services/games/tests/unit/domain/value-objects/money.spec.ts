import { describe, it, expect } from 'bun:test';
import { Money } from '../../../../src/domain/value-objects/money.vo';

describe('Money', () => {
  describe('of()', () => {
    it('creates a Money with a valid amount', () => {
      expect(Money.of(1000n).amount).toBe(1000n);
    });

    it('allows zero', () => {
      expect(Money.of(0n).amount).toBe(0n);
    });

    it('throws when amount is negative', () => {
      expect(() => Money.of(-1n)).toThrow('Money cannot be negative');
    });
  });

  describe('equals()', () => {
    it('returns true for the same amount', () => {
      expect(Money.of(500n).equals(Money.of(500n))).toBe(true);
    });

    it('returns false for different amounts', () => {
      expect(Money.of(500n).equals(Money.of(501n))).toBe(false);
    });
  });
});
