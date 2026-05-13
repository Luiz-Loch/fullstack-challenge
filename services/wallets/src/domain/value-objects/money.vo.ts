/**
 * Value object representing a monetary amount in cents (BIGINT).
 * Immutable — every operation returns a new instance.
 */
export class Money {
  private constructor(readonly amount: bigint) {}

  /**
   * Creates a Money from a cents value. Throws if negative.
   */
  static of(amount: bigint): Money {
    if (amount < 0n) {
        throw new Error('Money cannot be negative');
    }
    return new Money(amount);
  }

  /** Returns the sum without mutating either operand. */
  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  /**
   * Returns the difference without mutating either operand.
   * Throws if the result would be negative — insufficient balance is a domain rule.
   */
  subtract(other: Money): Money {
    const result = this.amount - other.amount;
    if (result < 0n) {
        throw new Error('Insufficient balance');
    }
    return new Money(result);
  }

  /**
   * Equality by value, not by reference.
   */
  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  /**
   * Creates a Money from a decimal value (e.g. 19.99 → 1999n).
   */
  static fromDecimal(value: number): Money {
    return Money.of(BigInt(Math.round(value * 100)));
  }

  /**
   * Converts cents back to a decimal value (e.g. 1999n → 19.99).
   */
  toDecimal(): number {
    return Number(this.amount) / 100;
  }

}
