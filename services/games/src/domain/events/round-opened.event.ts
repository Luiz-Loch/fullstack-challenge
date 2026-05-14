/**
 * Emitted when a new round is created and the BETTING phase opens.
 * Carries the server seed hash so clients can record it before placing bets
 * and later verify the crash point after the round crashes.
 */
export class RoundOpened {
  readonly occurredAt = new Date();

  constructor(
    readonly roundId: string,
    /** SHA256(serverSeed) — published upfront for provably fair verification. */
    readonly serverSeedHash: string,
  ) {}
}
