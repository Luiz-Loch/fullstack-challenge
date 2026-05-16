import { describe, it, expect } from 'bun:test';
import { Round } from '../../../src/domain/round.aggregate';
import { Money } from '../../../src/domain/value-objects/money.vo';
import { Multiplier } from '../../../src/domain/value-objects/multiplier.vo';
import { RoundStatus } from '../../../src/domain/enums/round-status.enum';
import { BetStatus } from '../../../src/domain/enums/bet-status.enum';
import { RoundOpened } from '../../../src/domain/events/round-opened.event';
import { RoundStarted } from '../../../src/domain/events/round-started.event';
import { RoundCrashed } from '../../../src/domain/events/round-crashed.event';
import { BetPlaced } from '../../../src/domain/events/bet-placed.event';
import { CashOutProcessed } from '../../../src/domain/events/cash-out-processed.event';

const CRASH_POINT = Multiplier.of(235n);
const SEED_HASH = 'abc123hash';
const SERVER_SEED = 'secret-seed';
const CLIENT_SEED = 'client-seed-abc123';

function newBettingRound(): Round {
  return Round.create(CRASH_POINT, SEED_HASH, CLIENT_SEED);
}

function newRunningRound(): Round {
  const round = newBettingRound();
  round.start();
  round.clearEvents();
  return round;
}

describe('Round', () => {
  describe('create()', () => {
    it('creates a round in BETTING state', () => {
      expect(newBettingRound().status).toBe(RoundStatus.BETTING);
    });

    it('generates a unique id', () => {
      expect(newBettingRound().id).not.toBe(newBettingRound().id);
    });

    it('emits RoundOpened with the serverSeedHash', () => {
      const round = newBettingRound();
      const events = round.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RoundOpened);
      expect((events[0] as RoundOpened).serverSeedHash).toBe(SEED_HASH);
    });

    it('does not reveal the server seed', () => {
      expect(newBettingRound().serverSeed).toBeNull();
    });
  });

  describe('reconstitute()', () => {
    it('restores state without emitting events', () => {
      const round = Round.reconstitute('id-1', RoundStatus.RUNNING, 235n, SEED_HASH, null, CLIENT_SEED, new Date(), null, new Date());
      expect(round.status).toBe(RoundStatus.RUNNING);
      expect(round.domainEvents).toHaveLength(0);
    });
  });

  describe('start()', () => {
    it('transitions BETTING → RUNNING', () => {
      const round = newBettingRound();
      round.start();
      expect(round.status).toBe(RoundStatus.RUNNING);
    });

    it('sets startedAt', () => {
      const round = newBettingRound();
      round.start();
      expect(round.startedAt).toBeInstanceOf(Date);
    });

    it('emits RoundStarted', () => {
      const round = newBettingRound();
      round.clearEvents();
      round.start();
      expect(round.domainEvents[0]).toBeInstanceOf(RoundStarted);
    });

    it('throws when called from RUNNING state', () => {
      const round = newRunningRound();
      expect(() => round.start()).toThrow();
    });

    it('throws when called from CRASHED state', () => {
      const round = newRunningRound();
      round.crash(SERVER_SEED);
      expect(() => round.start()).toThrow();
    });
  });

  describe('crash()', () => {
    it('transitions RUNNING → CRASHED', () => {
      const round = newRunningRound();
      round.crash(SERVER_SEED);
      expect(round.status).toBe(RoundStatus.CRASHED);
    });

    it('reveals the server seed', () => {
      const round = newRunningRound();
      round.crash(SERVER_SEED);
      expect(round.serverSeed).toBe(SERVER_SEED);
    });

    it('sets crashedAt', () => {
      const round = newRunningRound();
      round.crash(SERVER_SEED);
      expect(round.crashedAt).toBeInstanceOf(Date);
    });

    it('emits RoundCrashed with crashPoint and serverSeed', () => {
      const round = newRunningRound();
      round.crash(SERVER_SEED);
      const event = round.domainEvents[0] as RoundCrashed;
      expect(event).toBeInstanceOf(RoundCrashed);
      expect(event.crashPointCentesimals).toBe(CRASH_POINT.centesimals);
      expect(event.serverSeed).toBe(SERVER_SEED);
    });

    it('marks all pending bets as LOST', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      round.placeBet('player-2', Money.of(2000n));
      round.start();
      round.crash(SERVER_SEED);
      expect(round.bets.every((b) => b.status === BetStatus.LOST)).toBe(true);
    });

    it('does not affect already cashed out bets', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      round.start();
      round.processCashOut('player-1', Multiplier.of(150n));
      round.crash(SERVER_SEED);
      expect(round.bets[0].status).toBe(BetStatus.CASHED_OUT);
    });

    it('throws when called from BETTING state', () => {
      expect(() => newBettingRound().crash(SERVER_SEED)).toThrow();
    });

    it('throws when called from CRASHED state', () => {
      const round = newRunningRound();
      round.crash(SERVER_SEED);
      expect(() => round.crash(SERVER_SEED)).toThrow();
    });
  });

  describe('placeBet()', () => {
    it('adds a bet to the round', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      expect(round.bets).toHaveLength(1);
    });

    it('emits BetPlaced with correct data', () => {
      const round = newBettingRound();
      round.clearEvents();
      round.placeBet('player-1', Money.of(1000n));
      const event = round.domainEvents[0] as BetPlaced;
      expect(event).toBeInstanceOf(BetPlaced);
      expect(event.playerId).toBe('player-1');
      expect(event.amountCents).toBe(1000n);
    });

    it('throws when called from RUNNING state', () => {
      const round = newRunningRound();
      expect(() => round.placeBet('player-1', Money.of(1000n))).toThrow('Bets are only accepted during the BETTING phase');
    });

    it('throws when player already has a bet in the round', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      expect(() => round.placeBet('player-1', Money.of(500n))).toThrow('Player already has a bet in this round');
    });

    it('allows different players to bet in the same round', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      round.placeBet('player-2', Money.of(2000n));
      expect(round.bets).toHaveLength(2);
    });
  });

  describe('processCashOut()', () => {
    it('calculates and sets payout on the bet', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      round.start();
      round.processCashOut('player-1', Multiplier.of(235n));
      expect(round.bets[0].payout!.amount).toBe(2350n);
    });

    it('emits CashOutProcessed with payout and multiplier', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      round.start();
      round.clearEvents();
      round.processCashOut('player-1', Multiplier.of(235n));
      const event = round.domainEvents[0] as CashOutProcessed;
      expect(event).toBeInstanceOf(CashOutProcessed);
      expect(event.payoutCents).toBe(2350n);
      expect(event.multiplierCentesimals).toBe(235n);
    });

    it('throws when called from BETTING state', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      expect(() => round.processCashOut('player-1', Multiplier.of(200n))).toThrow('Cash outs are only accepted during the RUNNING phase');
    });

    it('throws when player has no active bet', () => {
      const round = newRunningRound();
      expect(() => round.processCashOut('player-1', Multiplier.of(200n))).toThrow('No active bet found for player in this round');
    });

    it('throws when player already cashed out', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      round.start();
      round.processCashOut('player-1', Multiplier.of(150n));
      expect(() => round.processCashOut('player-1', Multiplier.of(200n))).toThrow();
    });
  });

  describe('domainEvents', () => {
    it('returns a copy — mutating it does not affect internal state', () => {
      const round = newBettingRound();
      round.domainEvents.push(null as any);
      expect(round.domainEvents).toHaveLength(1);
    });
  });

  describe('bets', () => {
    it('returns a copy — mutating it does not affect internal state', () => {
      const round = newBettingRound();
      round.placeBet('player-1', Money.of(1000n));
      round.bets.push(null as any);
      expect(round.bets).toHaveLength(1);
    });
  });

  describe('clearEvents()', () => {
    it('removes all pending events', () => {
      const round = newBettingRound();
      round.clearEvents();
      expect(round.domainEvents).toHaveLength(0);
    });
  });
});
