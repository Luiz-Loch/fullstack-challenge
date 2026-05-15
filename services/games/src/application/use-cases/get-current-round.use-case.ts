import { Inject, Injectable, Logger } from '@nestjs/common';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { type Bet } from '@/domain/bet.entity';
import { RoundScheduler, type RoundSnapshot } from '../round.scheduler';

export interface CurrentRound
  extends RoundSnapshot {
  bets: Bet[];
}

@Injectable()
export class GetCurrentRoundUseCase {
  private readonly logger = new Logger(GetCurrentRoundUseCase.name);

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    private readonly roundScheduler: RoundScheduler,
  ) {}

  /**
   * Returns a snapshot of the currently active round, including the live multiplier and all bets.
   * Returns null when no round is in progress (e.g. between rounds).
   */
  async execute(): Promise<CurrentRound | null> {
    const snapshot = this.roundScheduler.getSnapshot();
    if (!snapshot) {
      this.logger.warn('No active round snapshot');
      return null;
    }

    const round = await this.roundRepository.findById(snapshot.roundId);
    if (!round) {
      this.logger.warn(`Round not found in repository: roundId=${snapshot.roundId}`);
      return null;
    }

    this.logger.debug(`Current round: roundId=${round.id} status=${round.status} bets=${round.bets.length}`);
    return { ...snapshot, bets: round.bets };
  }
}
