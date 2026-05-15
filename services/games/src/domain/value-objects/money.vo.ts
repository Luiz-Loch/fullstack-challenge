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

  /** Compares by value, not by reference. */
  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}
