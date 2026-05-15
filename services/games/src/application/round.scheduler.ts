import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID, UUID } from 'crypto';
import { Multiplier, ProvablyFair, Round, RoundStatus } from '@/domain';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';

// Betting window before each round starts.
const BETTING_PHASE_MS = 10_000;

// Brief pause between a crash and the next betting phase.
const POST_CRASH_WAIT_MS = 3_000;

// Multiplier sampling rate — determines how often the tick callback runs.
const TICK_INTERVAL_MS = 100;

// Multiplier doubles every T_DOUBLE_MS milliseconds: multiplier(t) = 2^(t / T_DOUBLE_MS).
// At 10 000 ms: 2.00x, at 20 000 ms: 4.00x, at 30 000 ms: 8.00x.
const T_DOUBLE_MS = 10_000;

export interface RoundSnapshot {
  roundId: string;
  status: RoundStatus;
  multiplier: Multiplier;
  serverSeedHash: string;
}

/**
 * Controls the perpetual game loop:
 *   BETTING (10s) → RUNNING (tick until crash point) → CRASHED (3s pause) → repeat
 *
 * State is kept in memory for performance. The serverSeed is held here until
 * the crash so it is never prematurely exposed — only the SHA-256 commitment
 * is visible to players during BETTING and RUNNING phases.
 */
@Injectable()
export class RoundScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoundScheduler.name);

  private currentRound: Round | null = null;
  private pendingServerSeed: string | null = null;
  private roundStartTime: number | null = null;
  private multiplier: Multiplier = Multiplier.of(100n);
  private ticker: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    private readonly provablyFair: ProvablyFair,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.openNewRound();
  }

  onModuleDestroy(): void {
    this.clearTicker();
  }

  /** Current round state snapshot for REST / WebSocket layers. */
  getSnapshot(): RoundSnapshot | null {
    if (!this.currentRound) return null;
    return {
      roundId: this.currentRound.id,
      status: this.currentRound.status,
      multiplier: this.multiplier,
      serverSeedHash: this.currentRound.serverSeedHash,
    };
  }

  getCurrentMultiplier(): Multiplier {
    return this.multiplier;
  }

  getCurrentRoundId(): string | null {
    return this.currentRound?.id ?? null;
  }

  private async openNewRound(): Promise<void> {
    const serverSeed: string = this.provablyFair.generateServerSeed();

    // In production this should be an external unpredictable value (e.g. a Bitcoin
    // block hash committed to before the serverSeed is generated). Using randomUUID()
    // as a stand-in keeps the provably-fair verification flow intact for this demo.
    const clientSeed: UUID = randomUUID();

    const crashPoint: Multiplier = this.provablyFair.generateCrashPoint(serverSeed, clientSeed);
    const serverSeedHash: string = this.provablyFair.computeCommitment(serverSeed);

    const round = Round.create(crashPoint, serverSeedHash, clientSeed);
    await this.roundRepository.save(round);

    this.currentRound = round;
    this.pendingServerSeed = serverSeed;
    this.multiplier = Multiplier.of(100n);

    this.logger.log(`Round opened: id=${round.id} crashPoint=${crashPoint.centesimals}cs`);

    setTimeout(() => void this.startRound(), BETTING_PHASE_MS);
  }

  private async startRound(): Promise<void> {
    if (!this.currentRound) return;

    this.currentRound.start();
    await this.roundRepository.save(this.currentRound);
    this.roundStartTime = Date.now();

    this.logger.log(`Round started: id=${this.currentRound.id}`);

    this.ticker = setInterval(() => void this.tick(), TICK_INTERVAL_MS);
  }

  private async tick(): Promise<void> {
    if (!this.currentRound || this.roundStartTime === null) return;

    const elapsedMs = Date.now() - this.roundStartTime;
    this.multiplier = Multiplier.of(BigInt(Math.floor(2 ** (elapsedMs / T_DOUBLE_MS) * 100)));

    if (this.multiplier.greaterThanOrEqual(this.currentRound.crashPoint)) {
      // Clear before first await to prevent any subsequent ticks from firing.
      this.clearTicker();
      await this.crashRound();
    }
  }

  private async crashRound(): Promise<void> {
    if (!this.currentRound || !this.pendingServerSeed) return;

    const serverSeed = this.pendingServerSeed;
    this.pendingServerSeed = null;

    this.currentRound.crash(serverSeed);
    await this.roundRepository.save(this.currentRound);

    this.logger.log(`Round crashed: id=${this.currentRound.id} at=${this.multiplier.centesimals}cs`);

    setTimeout(() => void this.openNewRound(), POST_CRASH_WAIT_MS);
  }

  private clearTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }
}
