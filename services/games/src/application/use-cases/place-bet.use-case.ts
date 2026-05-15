import { Inject, Injectable, Logger } from '@nestjs/common';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { Money } from '@/domain/value-objects/money.vo';

export interface PlaceBetCommand {
  roundId: string;
  playerId: string;
  amountCents: bigint;
}

export interface PlaceBetResult {
  betId: string;
  roundId: string;
  amountCents: bigint;
  placedAt: Date;
}

/**
 * Registers a player's bet in an active round.
 * Validates that the round is in BETTING state and that the player has not already bet,
 * then delegates to the Round aggregate and persists the result.
 */
@Injectable()
export class PlaceBetUseCase {
    private readonly logger = new Logger(PlaceBetUseCase.name);

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) { }

  /**
   * Places the bet and returns the created bet's identifiers and timestamp.
   * @throws {Error} If the round is not found, not in BETTING state, or player already has a bet.
   */
  async execute(command: PlaceBetCommand): Promise<PlaceBetResult> {
    this.logger.log(`Placing bet: player=${command.playerId} round=${command.roundId} amount=${command.amountCents}`);

    const round = await this.roundRepository.findById(command.roundId);
    if (!round) {
      this.logger.warn(`Round not found: ${command.roundId}`);
      throw new Error(`Round ${command.roundId} not found`);
    }

    const bet = round.placeBet(command.playerId, Money.of(command.amountCents));
    await this.roundRepository.save(round);

    this.logger.log(`Bet placed: bet=${bet.id} player=${command.playerId} round=${round.id}`);

    return {
      betId: bet.id,
      roundId: round.id,
      amountCents: bet.amount.amount,
      placedAt: bet.placedAt,
    };
  }

}