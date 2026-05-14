/**
 * Value object representing a monetary amount stored as integer cents (BIGINT).
 * Immutable — every operation returns a new instance instead of mutating.
 */
export class Money {
  /** Raw amount in cents. */
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

}
