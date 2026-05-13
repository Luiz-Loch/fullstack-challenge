/** Emitted when an amount is credited to a wallet. */
export class BalanceCredited {
  readonly occurredAt = new Date()

  constructor(
    readonly walletId: string,
    /** Credited amount in cents. */
    readonly amount: bigint,
  ) {}

}
