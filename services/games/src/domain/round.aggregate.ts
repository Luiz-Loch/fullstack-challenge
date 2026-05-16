import { randomUUID } from 'crypto';
import { RoundStatus } from './enums/round-status.enum';
import { BetStatus } from './enums/bet-status.enum';
import { Multiplier } from './value-objects/multiplier.vo';
import { Money } from './value-objects/money.vo';
import { Bet } from './bet.entity';
import { RoundOpened } from './events/round-opened.event';
import { RoundStarted } from './events/round-started.event';
import { RoundCrashed } from './events/round-crashed.event';
import { BetPlaced } from './events/bet-placed.event';
import { CashOutProcessed } from './events/cash-out-processed.event';

type DomainEvent = RoundOpened | RoundStarted | RoundCrashed | BetPlaced | CashOutProcessed;

/**
 * Round aggregate root.
 * Owns the lifecycle of a single game round via a strict state machine:
 *   BETTING → RUNNING → CRASHED
 *
 * The crash point is pre-determined at creation (provably fair) and hidden
 * from presentation until the round crashes. The server seed hash is published
 * upfront so players can verify fairness after the fact.
 */
export class Round {
  private readonly _domainEvents: DomainEvent[] = [];

  private constructor(
    readonly id: string,

    private _status: RoundStatus,

    /**
     * Pre-determined crash point. Presentation layer must NOT expose this
     * until status === CRASHED — use serverSeedHash for pre-round transparency.
     */
    private readonly _crashPoint: Multiplier,

    /** SHA256(serverSeed), published at round creation for provably fair verification. */
    private readonly _serverSeedHash: string,

    /** Revealed only when the round crashes. Null while BETTING or RUNNING. */
    private _serverSeed: string | null,

    /**
     * External unpredictable seed (e.g. Bitcoin block hash) combined with serverSeed
     * via HMAC to produce the crash point.
     */
    private readonly _clientSeed: string,

    private _startedAt: Date | null,

    private _crashedAt: Date | null,

    readonly createdAt: Date,

    private _bets: Bet[],
  ) {}

  get status(): RoundStatus {
    return this._status;
  }

  get crashPoint(): Multiplier {
    return this._crashPoint;
  }

  get serverSeedHash(): string {
    return this._serverSeedHash;
  }

  get serverSeed(): string | null {
    return this._serverSeed;
  }

  get clientSeed(): string {
    return this._clientSeed;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get crashedAt(): Date | null {
    return this._crashedAt;
  }

  /** Returns a shallow copy — mutating the result does not affect internal state. */
  get bets(): Bet[] {
    return [...this._bets];
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
   * Creates a new round in BETTING state.
   * The crash point must be pre-computed by the provably fair algorithm before calling this.
   *
   * @param crashPoint - Pre-determined crash point (hidden until crash).
   * @param serverSeedHash - SHA256 of the server seed, published immediately for player verification.
   * @param clientSeed - External unpredictable seed used to derive the crash point.
   */
  static create(crashPoint: Multiplier, serverSeedHash: string, clientSeed: string): Round {
    const round = new Round(
      randomUUID(),
      RoundStatus.BETTING,
      crashPoint,
      serverSeedHash,
      null,
      clientSeed,
      null,
      null,
      new Date(),
      [],
    );
    round._domainEvents.push(new RoundOpened(round.id, serverSeedHash));
    return round;
  }

  /**
   * Rebuilds a Round from a persisted record without emitting events.
   * Use in repository find mappings.
   */
  static reconstitute(
    id: string,
    status: RoundStatus,
    crashPointCentesimals: bigint,
    serverSeedHash: string,
    serverSeed: string | null,
    clientSeed: string,
    startedAt: Date | null,
    crashedAt: Date | null,
    createdAt: Date,
    bets: Bet[] = [],
  ): Round {
    return new Round(
      id,
      status,
      Multiplier.of(crashPointCentesimals),
      serverSeedHash,
      serverSeed,
      clientSeed,
      startedAt,
      crashedAt,
      createdAt,
      bets,
    );
  }

  /**
   * Transitions BETTING → RUNNING. Emits {@link RoundStarted}.
   * @throws {Error} If round is not in BETTING state.
   */
  start(): void {
    if (this._status !== RoundStatus.BETTING) {
      throw new Error(`Cannot start a round in ${this._status} state`);
    }
    this._status = RoundStatus.RUNNING;
    this._startedAt = new Date();
    this._domainEvents.push(new RoundStarted(this.id, this._startedAt));
  }

  /**
   * Accepts a bet from a player. Emits {@link BetPlaced}.
   * @throws {Error} If round is not in BETTING state, or player already has a bet.
   */
  placeBet(playerId: string, amount: Money): Bet {
    this.assertBettingOpen();

    const alreadyBet = this._bets.some((b) => b.playerId === playerId);
    if (alreadyBet) {
      throw new Error('Player already has a bet in this round');
    }

    const bet = Bet.create(this.id, playerId, amount);
    this._bets.push(bet);
    this._domainEvents.push(new BetPlaced(this.id, bet.id, playerId, amount.amount));
    return bet;
  }

  /**
   * Processes a cashout for a player. Emits {@link CashOutProcessed}.
   * @throws {Error} If round is not RUNNING, or player has no active bet.
   */
  processCashOut(playerId: string, currentMultiplier: Multiplier): Bet {
    this.assertRunning();

    const bet = this._bets.find(
      (b) => b.playerId === playerId && b.status === BetStatus.PENDING,
    );
    if (!bet) {
      throw new Error('No active bet found for player in this round');
    }

    bet.cashOut(currentMultiplier);
    this._domainEvents.push(
      new CashOutProcessed(
        this.id,
        bet.id,
        playerId,
        bet.payout!.amount,
        currentMultiplier.centesimals,
      ),
    );
    return bet;
  }

  /**
   * Transitions RUNNING → CRASHED, marks all pending bets as lost, reveals the server seed.
   * Emits {@link RoundCrashed}.
   * @param serverSeed - The original seed used to generate the crash point.
   * @throws {Error} If round is not in RUNNING state.
   */
  crash(serverSeed: string): void {
    if (this._status !== RoundStatus.RUNNING) {
      throw new Error(`Cannot crash a round in ${this._status} state`);
    }

    for (const bet of this._bets) {
      if (bet.status === BetStatus.PENDING) {
        bet.lose();
      }
    }

    this._status = RoundStatus.CRASHED;
    this._serverSeed = serverSeed;
    this._crashedAt = new Date();
    this._domainEvents.push(
      new RoundCrashed(this.id, this._crashPoint.centesimals, serverSeed, this._crashedAt),
    );
  }

  /**
   * Asserts the round is in BETTING state.
   * Used by Bet operations to enforce the invariant "no bets during RUNNING".
   * @throws {Error} If round is not in BETTING state.
   */
  assertBettingOpen(): void {
    if (this._status !== RoundStatus.BETTING) {
      throw new Error('Bets are only accepted during the BETTING phase');
    }
  }

  /**
   * Asserts the round is in RUNNING state.
   * Used by cashout operations to enforce the invariant "no cashout during BETTING".
   * @throws {Error} If round is not in RUNNING state.
   */
  assertRunning(): void {
    if (this._status !== RoundStatus.RUNNING) {
      throw new Error('Cash outs are only accepted during the RUNNING phase');
    }
  }

}
