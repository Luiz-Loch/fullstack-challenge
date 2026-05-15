/** Emitted when a player successfully cashes out during the RUNNING phase. */
export class CashOutProcessed {
  readonly occurredAt = new Date();

  constructor(
    readonly roundId: string,
    readonly betId: string,
    readonly playerId: string,
    /** Final payout in cents (bet × multiplier). */
    readonly payoutCents: bigint,
    /** Multiplier at which the cashout occurred, in centesimals (e.g. 150 = 1.50x). */
    readonly multiplierCentesimals: bigint,
  ) {}
}
