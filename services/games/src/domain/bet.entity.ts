import { randomUUID } from 'crypto';
import { BetStatus } from './enums/bet-status.enum';
import { Money } from './value-objects/money.vo';
import { Multiplier } from './value-objects/multiplier.vo';

const MIN_BET = Money.of(1_00n);     // R$ 1,00
const MAX_BET = Money.of(1_000_00n); // R$ 1.000,00

/**
 * Bet entity. Belongs to a Round aggregate — never persisted or queried independently.
 * Transitions: PENDING → CASHED_OUT | LOST
 */
export class Bet {
  private constructor(
    readonly id: string,
    readonly roundId: string,
    readonly playerId: string,
    readonly username: string,
    private readonly _amount: Money,
    private _status: BetStatus,
    private _payout: Money | null,
    private _cashedOutAt: Date | null,
    readonly placedAt: Date,
  ) {}

  get amount(): Money {
    return this._amount;
  }

  get status(): BetStatus {
    return this._status;
  }

  get payout(): Money | null {
    return this._payout;
  }

  get cashedOutAt(): Date | null {
    return this._cashedOutAt;
  }

  /**
   * @throws {Error} If amount is outside the allowed min/max range.
   */
  static create(roundId: string, playerId: string, username: string, amount: Money): Bet {
    if (amount.amount < MIN_BET.amount) {
      throw new Error(`Minimum bet is ${MIN_BET.amount} cents`);
    }
    if (amount.amount > MAX_BET.amount) {
      throw new Error(`Maximum bet is ${MAX_BET.amount} cents`);
    }
    return new Bet(randomUUID(), roundId, playerId, username, amount, BetStatus.PENDING, null, null, new Date());
  }

  /** Rebuilds a Bet from a persisted record without side effects. */
  static reconstitute(
    id: string,
    roundId: string,
    playerId: string,
    username: string,
    amountCents: bigint,
    status: BetStatus,
    payoutCents: bigint | null,
    cashedOutAt: Date | null,
    placedAt: Date,
  ): Bet {
    return new Bet(
      id,
      roundId,
      playerId,
      username,
      Money.of(amountCents),
      status,
      payoutCents !== null ? Money.of(payoutCents) : null,
      cashedOutAt,
      placedAt,
    );
  }

  /**
   * Calculates payout and transitions PENDING → CASHED_OUT.
   * Payout = (amount × multiplier) with integer arithmetic — no floats.
   * @throws {Error} If bet is not PENDING.
   */
  cashOut(currentMultiplier: Multiplier): void {
    if (this._status !== BetStatus.PENDING) {
      throw new Error('Only pending bets can be cashed out');
    }
    const payoutCents = (this._amount.amount * currentMultiplier.centesimals) / 100n;
    this._payout = Money.of(payoutCents);
    this._status = BetStatus.CASHED_OUT;
    this._cashedOutAt = new Date();
  }

  /**
   * Transitions PENDING → LOST.
   * Called by Round when the round crashes.
   * @throws {Error} If bet is not PENDING.
   */
  lose(): void {
    if (this._status !== BetStatus.PENDING) {
      throw new Error('Only pending bets can be marked as lost');
    }
    this._status = BetStatus.LOST;
    this._payout = Money.of(0n);
  }
}
