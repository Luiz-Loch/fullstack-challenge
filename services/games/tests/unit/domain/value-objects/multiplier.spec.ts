import { describe, it, expect } from 'bun:test';
import { Multiplier } from '../../../../src/domain/value-objects/multiplier.vo';

describe('Multiplier', () => {
  describe('of()', () => {
    it('creates a Multiplier with a valid centesimal value', () => {
      const m = Multiplier.of(150n);
      expect(m.centesimals).toBe(150n);
    });

    it('allows exactly 1.00x (100n)', () => {
      const m = Multiplier.of(100n);
      expect(m.centesimals).toBe(100n);
    });

    it('throws when value is below 1.00x', () => {
      expect(() => Multiplier.of(99n)).toThrow();
    });
  });

  describe('equals()', () => {
    it('returns true for the same centesimal value', () => {
      expect(Multiplier.of(200n).equals(Multiplier.of(200n))).toBe(true);
    });

    it('returns false for different values', () => {
      expect(Multiplier.of(200n).equals(Multiplier.of(201n))).toBe(false);
    });
  });
});
