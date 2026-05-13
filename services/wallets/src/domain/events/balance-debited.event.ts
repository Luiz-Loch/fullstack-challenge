/** Emitted when an amount is debited from a wallet. */
export class BalanceDebited {
  readonly occurredAt = new Date()

  constructor(
    readonly walletId: string,
    /** Debited amount in cents. */
    readonly amount: bigint,
  ) {}

}
