/**
 * Value object representing a monetary amount stored as integer cents (BIGINT).
 * Immutable — every operation returns a new instance instead of mutating.
 */
export class Money {
  /** Raw amount in cents. Use {@link toDecimal} to convert for display. */
  private constructor(readonly amount: bigint) {}

  /**
   * Primary factory. Creates a Money from an integer cent value.
   * @param amount - Amount in cents (e.g. 1999n for $19.99).
   * @throws {Error} If amount is negative.
   */
  static of(amount: bigint): Money {
    if (amount < 0n) {
        throw new Error('Money cannot be negative');
    }
    return new Money(amount);
  }

  /**
   * Creates a Money from a decimal value, rounding to the nearest cent.
   * Use at system boundaries (e.g. parsing user input or API payloads).
   * @param value - Decimal value (e.g. 19.99).
   */
  static fromDecimal(value: number): Money {
    return Money.of(BigInt(Math.round(value * 100)));
  }

  /**
   * Returns a new Money with the sum of both amounts.
   * Does not mutate either operand.
   */
  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  /**
   * Returns a new Money with the difference.
   * Does not mutate either operand.
   * @throws {Error} If the result would be negative — insufficient balance is a domain rule.
   */
  subtract(other: Money): Money {
    const result = this.amount - other.amount;
    if (result < 0n) {
        throw new Error('Insufficient balance');
    }
    return new Money(result);
  }

  /** Compares by value, not by reference. */
  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  /**
   * Converts cents to a decimal value for display or serialization.
   * Use at system boundaries (e.g. building API responses).
   * @returns Decimal value (e.g. 1999n → 19.99).
   */
  toDecimal(): number {
    return Number(this.amount) / 100;
  }

}
