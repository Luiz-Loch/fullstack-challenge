import { Inject, Injectable, Logger } from '@nestjs/common';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';

export interface CashOutCommand {
  roundId: string;
  playerId: string;
  currentMultiplier: bigint;
}

export interface CashOutResult {
  betId: string;
  roundId: string;
  payoutCents: bigint;
  cashedOutAt: Date;
}

/**
 * Processes a player's cash out during an active round.
 * Receives the current multiplier from the game loop, calculates the payout
 * via the Round aggregate, and persists the result.
 */
@Injectable()
export class CashOutUseCase {
  private readonly logger = new Logger(CashOutUseCase.name);

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) { }

  /**
   * Cashes out the player's pending bet and returns the payout amount.
   * @throws {Error} If the round is not found, not in RUNNING state, or player has no active bet.
   */
  async execute(command: CashOutCommand): Promise<CashOutResult> {
    this.logger.log(`Cashing out: player=${command.playerId} round=${command.roundId} multiplier=${command.currentMultiplier}`);

    const round = await this.roundRepository.findById(command.roundId);
    if (!round) {
      this.logger.warn(`Round not found: ${command.roundId}`);
      throw new Error(`Round ${command.roundId} not found`);
    }

    const bet = round.processCashOut(
      command.playerId,
      Multiplier.of(command.currentMultiplier),
    );
    await this.roundRepository.save(round);

    this.logger.log(`Cash out processed: bet=${bet.id} player=${command.playerId} payout=${bet.payout!.amount}`);

    return {
      betId: bet.id,
      roundId: round.id,
      payoutCents: bet.payout!.amount,
      cashedOutAt: bet.cashedOutAt!,
    };
  }

}