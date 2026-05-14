/** Emitted when a round transitions from BETTING to RUNNING. */
export class RoundStarted {
  readonly occurredAt = new Date();

  constructor(
    readonly roundId: string,
    readonly startedAt: Date,
  ) {}
}
