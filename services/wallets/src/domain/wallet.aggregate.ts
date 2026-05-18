import { randomUUID } from 'crypto'
import { Money } from './value-objects/money.vo'
import { WalletCreated } from './events/wallet-created.event'
import { BalanceCredited } from './events/balance-credited.event'
import { BalanceDebited } from './events/balance-debited.event'

type DomainEvent = WalletCreated | BalanceCredited | BalanceDebited

/**
 * Wallet aggregate root.
 * Owns the player's balance and enforces the invariant that balance >= 0.
 * Accumulates domain events that the repository drains after persisting.
 */
export class Wallet {
  private readonly _domainEvents: DomainEvent[] = [];

  private constructor(
    /** Unique wallet identifier (UUID). */
    readonly id: string,
    /** Keycloak subject (`sub`) that owns this wallet. */
    readonly playerId: string,
    private _balance: Money,
  ) {}

  /** Current balance. Always >= 0 by invariant. */
  get balance(): Money {
    return this._balance;
  }

  /**
   * Pending domain events since the last {@link clearEvents} call.
   * Returns a shallow copy — mutating the result does not affect internal state.
   */
  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Removes all pending events.
   * Call after persisting the aggregate and publishing the events.
   */
  clearEvents(): void {
    this._domainEvents.length = 0;
  }

  /**
   * Creates a new wallet with zero balance and emits {@link WalletCreated}.
   * @param playerId - Keycloak subject (`sub`) of the owning player.
   */
  static create(playerId: string): Wallet {
    const wallet = new Wallet(randomUUID(), playerId, Money.of(10_000_00n)); // R$10.000,00 initial balance for testing/demo purposes
    wallet._domainEvents.push(new WalletCreated(wallet.id, playerId));
    return wallet;
  }

  /**
   * Rebuilds a Wallet from a persisted record without emitting events.
   * Use in repository `findById` / `findByPlayerId` mappings.
   * @param balanceInCents - Integer cent value stored in the database.
   */
  static reconstitute(id: string, playerId: string, balanceInCents: bigint): Wallet {
    return new Wallet(id, playerId, Money.of(balanceInCents));
  }

  /**
   * Adds the given amount to the balance and emits {@link BalanceCredited}.
   * @param amount - Positive amount to credit.
   */
  credit(amount: Money): void {
    this._balance = this._balance.add(amount);
    this._domainEvents.push(new BalanceCredited(this.id, amount.amount));
  }

  /**
   * Subtracts the given amount from the balance and emits {@link BalanceDebited}.
   * @param amount - Positive amount to debit.
   * @throws {Error} If balance would go negative (delegated to {@link Money.subtract}).
   */
  debit(amount: Money): void {
    this._balance = this._balance.subtract(amount);
    this._domainEvents.push(new BalanceDebited(this.id, amount.amount));
  }

}
