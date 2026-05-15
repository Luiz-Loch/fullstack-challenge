import { Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'crypto';
import { Multiplier } from './value-objects/multiplier.vo';

/**
 * Provably fair crash point generation using HMAC-SHA256.
 *
 * Flow per round:
 *   1. Server generates a random serverSeed.
 *   2. Server publishes SHA256(serverSeed) as a commitment BEFORE betting opens.
 *   3. Crash point = HMAC-SHA256(serverSeed, clientSeed) → deterministic multiplier.
 *   4. After crash, server reveals serverSeed so any player can independently verify.
 *
 * House edge: 1% — baked into the crash point formula, not into a separate check.
 * Return to Player (RTP): 99%.
 */
@Injectable()
export class ProvablyFair {
  // House edge percentage taken by the game, expressed as a decimal (e.g., 0.01 for 1%).
  private readonly HOUSE_EDGE = 0.01;

  // 32-bit integer space derived from the first 4 bytes of the HMAC hash.
  private readonly MAX = 2 ** 32;

  // Hash algorithm used for both commitment and crash point generation.
  private readonly HASH_ALGORITHM = 'sha256';

  /** Generates a cryptographically secure random server seed (64 hex chars). */
  generateServerSeed(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Computes the public commitment for a server seed.
   * Publish this before betting opens — reveals nothing about the crash point.
   */
  computeCommitment(serverSeed: string): string {
    return createHash(this.HASH_ALGORITHM).update(serverSeed).digest('hex');
  }

  /**
   * Derives the crash point from a (serverSeed, clientSeed) pair.
   *
   * The clientSeed should be an external, unpredictable value (e.g., a future
   * Bitcoin block hash) so that not even the server can predict the result when
   * the commitment is published.
   *
   * @param serverSeed - Secret seed, revealed only after the round crashes.
   * @param clientSeed - Public seed, unknown at commitment time.
   */
  generateCrashPoint(serverSeed: string, clientSeed: string): Multiplier {
    const hash: string = createHmac(this.HASH_ALGORITHM, serverSeed).update(clientSeed).digest('hex');
    return this.hashToCrashPoint(hash);
  }

  /**
   * Verifies that a revealed serverSeed matches the published commitment and
   * produces the claimed crash point.
   *
   * Players call this after the round to confirm the result was not manipulated.
   *
   * @returns true if commitment and crash point both check out.
   */
  verify(
    serverSeed: string,
    clientSeed: string,
    commitment: string,
    claimedCrashPoint: Multiplier,
  ): boolean {
    if (this.computeCommitment(serverSeed) !== commitment) {
      return false;
    }
    const actual: Multiplier = this.generateCrashPoint(serverSeed, clientSeed);
    return actual.equals(claimedCrashPoint);
  }

  /**
   * Converts the first 4 bytes of a hex hash into a crash point Multiplier.
   *
   * Formula: crashPoint = (1 - houseEdge) × MAX / (MAX − h)
   *   - h uniform in [0, MAX) → crashPoint follows P(crash > C) = 0.99 / C
   *   - Values below 1.00x are clamped to 1.00x (≈1% of rounds, house edge floor)
   */
  private hashToCrashPoint(hash: string): Multiplier {
    // First 4 bytes → 32-bit integer in [0, MAX - 1] (base 16)
    const h: number = parseInt(hash.slice(0, 8), 16);

    /* The expected formula is a Pareto distribution with a 1% house edge:
     * https://en.wikipedia.org/wiki/Pareto_distribution
     *
     * To obtain a Pareto distribution from a random variable h uniformly distributed in [0, MAX - 1], the inverse CDF of the Pareto distribution can be used:
     * Formula accessed from: https://en.wikipedia.org/wiki/Pareto_distribution#Random_variate_generation
     */
    const raw: number = (1 - this.HOUSE_EDGE) * this.MAX / (this.MAX - h);

    // Clamp to 1.00x minimum to ensure house edge is maintained even in the rare case of very low h.
    const centesimals: bigint = BigInt(Math.max(100, Math.floor(raw * 100)));
    return Multiplier.of(centesimals);
  }

}
