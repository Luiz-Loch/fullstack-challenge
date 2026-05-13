/** Emitted when a new wallet is created for a player. */
export class WalletCreated {
  readonly occurredAt = new Date()

  constructor(
    readonly walletId: string,
    /** Keycloak subject (`sub`) of the owning player. */
    readonly playerId: string,
  ) {}

}
