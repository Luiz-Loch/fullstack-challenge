/** Emitted when a player successfully places a bet in the BETTING phase. */
export class BetPlaced {
  readonly occurredAt = new Date();

  constructor(
    readonly roundId: string,
    readonly betId: string,
    readonly playerId: string,
    /** Bet amount in cents. */
    readonly amountCents: bigint,
  ) {}
}
