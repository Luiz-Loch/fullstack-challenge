import { describe, it, expect } from 'bun:test'
import { Money } from '../../../../src/domain/value-objects/money.vo'

describe('Money', () => {
  describe('of()', () => {
    it('creates a Money with a valid amount', () => {
      const money = Money.of(1999n)
      expect(money.amount).toBe(1999n)
    })

    it('throws when amount is negative', () => {
      expect(() => Money.of(-1n)).toThrow('Money cannot be negative')
    })

    it('allows zero', () => {
      const money = Money.of(0n)
      expect(money.amount).toBe(0n)
    })
  })

  describe('add()', () => {
    it('returns the sum without mutating operands', () => {
      const a = Money.of(1000n)
      const b = Money.of(500n)
      const result = a.add(b)

      expect(result.amount).toBe(1500n)
      expect(a.amount).toBe(1000n)
      expect(b.amount).toBe(500n)
    })
  })

  describe('subtract()', () => {
    it('returns the difference without mutating operands', () => {
      const a = Money.of(1000n)
      const b = Money.of(300n)
      const result = a.subtract(b)

      expect(result.amount).toBe(700n)
      expect(a.amount).toBe(1000n)
      expect(b.amount).toBe(300n)
    })

    it('allows subtracting the exact balance', () => {
      const a = Money.of(500n)
      const result = a.subtract(Money.of(500n))
      expect(result.amount).toBe(0n)
    })

    it('throws when result would be negative', () => {
      const a = Money.of(100n)
      expect(() => a.subtract(Money.of(200n))).toThrow('Insufficient balance')
    })
  })

  describe('equals()', () => {
    it('returns true for same value', () => {
      expect(Money.of(100n).equals(Money.of(100n))).toBe(true)
    })

    it('returns false for different values', () => {
      expect(Money.of(100n).equals(Money.of(101n))).toBe(false)
    })
  })

  describe('fromDecimal()', () => {
    it('converts decimal to cents', () => {
      expect(Money.fromDecimal(19.99).amount).toBe(1999n)
    })

    it('rounds correctly to avoid float imprecision', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754
      expect(Money.fromDecimal(0.1 + 0.2).amount).toBe(30n)
    })
  })

  describe('toDecimal()', () => {
    it('converts cents back to decimal', () => {
      expect(Money.of(1999n).toDecimal()).toBe(19.99)
    })

    it('round-trips fromDecimal → toDecimal', () => {
      expect(Money.fromDecimal(42.50).toDecimal()).toBe(42.50)
    })
  })
})