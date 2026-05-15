/**
 * Emitted when a round transitions from RUNNING to CRASHED.
 * Carries the server seed so subscribers can verify the provably fair crash point.
 */
export class RoundCrashed {
  readonly occurredAt = new Date();

  constructor(
    readonly roundId: string,
    /** Final crash point in centesimals (e.g. 150n = 1.50x). */
    readonly crashPointCentesimals: bigint,
    /** Revealed server seed — players can now verify SHA256(serverSeed) == serverSeedHash. */
    readonly serverSeed: string,
    readonly crashedAt: Date,
  ) { }

}
