/**
 * Value object representing a game multiplier stored as integer centesimals (BIGINT).
 * 100n = 1.00x, 150n = 1.50x, 250n = 2.50x.
 * Immutable — every operation returns a new instance instead of mutating.
 */
export class Multiplier {
  /** Raw value in centesimals. */
  private constructor(readonly centesimals: bigint) {}

  /**
   * Primary factory. Creates a Multiplier from an integer centesimal value.
   * @param centesimals - Value in centesimals (e.g. 150n for 1.50x).
   * @throws {Error} If value is below 1.00x (100n).
   */
  static of(centesimals: bigint): Multiplier {
    if (centesimals < 100n) {
      throw new Error('Multiplier must be >= 1.00x (100 centesimals)');
    }
    return new Multiplier(centesimals);
  }

  /** Compares by value, not by reference. */
  equals(other: Multiplier): boolean {
    return this.centesimals === other.centesimals;
  }

  greaterThanOrEqual(other: Multiplier): boolean {
    return this.centesimals >= other.centesimals;
  }

}
