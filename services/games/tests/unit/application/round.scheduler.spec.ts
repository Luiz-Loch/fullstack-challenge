import { describe, it, expect, mock, beforeEach, afterEach, jest } from 'bun:test';
import { RoundScheduler } from '../../../src/application/round.scheduler';
import { Multiplier, RoundStatus } from '../../../src/domain';

// Must match the constants in round.scheduler.ts
const BETTING_PHASE_MS = 10_000;
const POST_CRASH_WAIT_MS = 3_000;
const TICK_INTERVAL_MS = 100;

// Flushes pending microtasks (async/await chains) without advancing fake timers.
const flushPromises = () => new Promise<void>(resolve => process.nextTick(resolve));

function makeRepository() {
  let lastSaved: any = null;
  return {
    save: mock((round: any) => { lastSaved = round; return Promise.resolve(); }),
    findById: mock((_id: string) => Promise.resolve(lastSaved)),
  };
}

function makeBetRepository() {
  return { save: mock(() => Promise.resolve()) };
}

function makeProvablyFair(crashPoint: Multiplier = Multiplier.of(500n)) {
  return {
    generateServerSeed: mock(() => 'test-server-seed'),
    computeCommitment: mock(() => 'a'.repeat(64)),
    generateCrashPoint: mock(() => crashPoint),
    verify: mock(() => true),
  };
}

describe('RoundScheduler', () => {
  describe('before initialisation', () => {
    it('getSnapshot() returns null', () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      expect(scheduler.getSnapshot()).toBeNull();
    });

    it('getCurrentRoundId() returns null', () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      expect(scheduler.getCurrentRoundId()).toBeNull();
    });

    it('onModuleDestroy() does not throw', () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      expect(() => scheduler.onModuleDestroy()).not.toThrow();
    });
  });

  describe('onModuleInit()', () => {
    it('opens a round in BETTING state', async () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      await scheduler.onModuleInit();
      expect(scheduler.getSnapshot()!.status).toBe(RoundStatus.BETTING);
    });

    it('sets the initial multiplier to 1.00x', async () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      await scheduler.onModuleInit();
      expect(scheduler.getCurrentMultiplier().centesimals).toBe(100n);
    });

    it('exposes a valid round id', async () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      await scheduler.onModuleInit();
      expect(scheduler.getCurrentRoundId()).toBeString();
    });

    it('publishes the server seed hash in the snapshot', async () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      await scheduler.onModuleInit();
      expect(scheduler.getSnapshot()!.serverSeedHash).toHaveLength(64);
    });

    it('persists the round exactly once', async () => {
      const repo = makeRepository();
      const scheduler = new RoundScheduler(repo as any, makeBetRepository() as any, makeProvablyFair() as any);
      await scheduler.onModuleInit();
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('delegates seed generation to ProvablyFair', async () => {
      const pf = makeProvablyFair();
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, pf as any);
      await scheduler.onModuleInit();
      expect(pf.generateServerSeed).toHaveBeenCalledTimes(1);
      expect(pf.generateCrashPoint).toHaveBeenCalledTimes(1);
      expect(pf.computeCommitment).toHaveBeenCalledTimes(1);
    });
  });

  describe('game loop (fake timers)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // ── Betting phase ──────────────────────────────────────────────────────────

    it('stays in BETTING before the phase window closes', async () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      await scheduler.onModuleInit();

      jest.advanceTimersByTime(BETTING_PHASE_MS - 1);
      await flushPromises();

      expect(scheduler.getSnapshot()!.status).toBe(RoundStatus.BETTING);
    });

    it('transitions to RUNNING exactly when the betting phase ends', async () => {
      const scheduler = new RoundScheduler(makeRepository() as any, makeBetRepository() as any, makeProvablyFair() as any);
      await scheduler.onModuleInit();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises();

      expect(scheduler.getSnapshot()!.status).toBe(RoundStatus.RUNNING);
    });

    it('persists twice on the BETTING → RUNNING transition (open + start)', async () => {
      const repo = makeRepository();
      const scheduler = new RoundScheduler(repo as any, makeBetRepository() as any, makeProvablyFair() as any);
      await scheduler.onModuleInit();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises();

      expect(repo.save).toHaveBeenCalledTimes(2);
    });

    // ── Crash ──────────────────────────────────────────────────────────────────

    it('crashes on the first tick when crash point equals the starting multiplier', async () => {
      const scheduler = new RoundScheduler(
        makeRepository() as any,
        makeBetRepository() as any,
        makeProvablyFair(Multiplier.of(100n)) as any,
      );
      await scheduler.onModuleInit();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises(); // RUNNING starts, setInterval registered

      jest.advanceTimersByTime(TICK_INTERVAL_MS); // first tick fires
      await flushPromises(); // crashRound() completes

      expect(scheduler.getSnapshot()!.status).toBe(RoundStatus.CRASHED);
    });

    it('persists three times through a complete round (open + start + crash)', async () => {
      const repo = makeRepository();
      const scheduler = new RoundScheduler(
        repo as any,
        makeBetRepository() as any,
        makeProvablyFair(Multiplier.of(100n)) as any,
      );
      await scheduler.onModuleInit();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises();
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
      await flushPromises();

      expect(repo.save).toHaveBeenCalledTimes(3);
    });

    it('does not crash before the multiplier reaches the crash point', async () => {
      const scheduler = new RoundScheduler(
        makeRepository() as any,
        makeBetRepository() as any,
        makeProvablyFair(Multiplier.of(10_000n)) as any,
      );
      await scheduler.onModuleInit();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises();
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 5);
      await flushPromises();

      expect(scheduler.getSnapshot()!.status).toBe(RoundStatus.RUNNING);
    });

    // ── New round after crash ───────────────────────────────────────────────────

    it('opens a new round after the post-crash wait', async () => {
      const scheduler = new RoundScheduler(
        makeRepository() as any,
        makeBetRepository() as any,
        makeProvablyFair(Multiplier.of(100n)) as any,
      );
      await scheduler.onModuleInit();
      const firstRoundId = scheduler.getCurrentRoundId();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises();
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
      await flushPromises(); // crash

      jest.advanceTimersByTime(POST_CRASH_WAIT_MS);
      await flushPromises(); // openNewRound()

      expect(scheduler.getCurrentRoundId()).not.toBe(firstRoundId);
      expect(scheduler.getSnapshot()!.status).toBe(RoundStatus.BETTING);
    });

    it('resets the multiplier to 1.00x when a new round opens', async () => {
      const scheduler = new RoundScheduler(
        makeRepository() as any,
        makeBetRepository() as any,
        makeProvablyFair(Multiplier.of(100n)) as any,
      );
      await scheduler.onModuleInit();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises();
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
      await flushPromises();
      jest.advanceTimersByTime(POST_CRASH_WAIT_MS);
      await flushPromises();

      expect(scheduler.getCurrentMultiplier().centesimals).toBe(100n);
    });

    // ── Destroy ────────────────────────────────────────────────────────────────

    it('stops persisting after onModuleDestroy() during RUNNING', async () => {
      const repo = makeRepository();
      const scheduler = new RoundScheduler(
        repo as any,
        makeBetRepository() as any,
        makeProvablyFair(Multiplier.of(10_000n)) as any,
      );
      await scheduler.onModuleInit();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises();
      const savesBeforeDestroy = repo.save.mock.calls.length;

      scheduler.onModuleDestroy();

      jest.advanceTimersByTime(BETTING_PHASE_MS);
      await flushPromises();

      expect(repo.save).toHaveBeenCalledTimes(savesBeforeDestroy);
    });
  });
});
