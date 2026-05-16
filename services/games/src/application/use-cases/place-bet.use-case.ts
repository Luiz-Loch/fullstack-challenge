import { ConflictException, Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { type IBetRepository, BET_REPOSITORY } from '@/domain/ports/bet.repository';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { Money } from '@/domain/value-objects/money.vo';


export interface PlaceBetCommand {
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
    @Inject(BET_REPOSITORY)
    private readonly betRepository: IBetRepository,
  ) { }

  /**
   * Finds the current round, registers the bet in the Round aggregate, and persists it.
   * Only the bet row is written — the round entity itself has no column changes when a bet is placed.
   *
   * @param command - Bet parameters: authenticated player id and amount in cents.
   * @returns Identifiers and timestamp of the created bet.
   * @throws {NotFoundException} If there is no active round.
   * @throws {ConflictException} If the player already has a bet in the current round.
   * @throws {UnprocessableEntityException} If the round is not in BETTING state, the amount is outside
   *   the allowed range, or any other domain invariant is violated.
   */
  async execute(command: PlaceBetCommand): Promise<PlaceBetResult> {
    this.logger.log(`Placing bet: player=${command.playerId} amount=${command.amountCents}`);

    const round = await this.roundRepository.findCurrent();
    if (!round) {
      this.logger.warn(`Round not found for placing bet: player=${command.playerId}`);
      throw new NotFoundException(`Round not found`);
    }

    try {
      const bet = round.placeBet(command.playerId, Money.of(command.amountCents));
      await this.betRepository.save(bet);
      this.logger.log(`Bet placed: bet=${bet.id} player=${command.playerId} round=${round.id}`);

      return {
        betId: bet.id,
        roundId: round.id,
        amountCents: bet.amount.amount,
        placedAt: bet.placedAt,
      };
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already has a bet')) {
        throw new ConflictException(message);
      }
      throw new UnprocessableEntityException(message);
    }
  }

}