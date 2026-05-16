import { Inject, Injectable, Logger } from '@nestjs/common';
import { BET_REPOSITORY, type IBetRepository } from '@/domain/ports/bet.repository';
import { type Bet } from '@/domain/bet.entity';

@Injectable()
export class GetPlayerBetHistoryUseCase {
  private readonly logger = new Logger(GetPlayerBetHistoryUseCase.name);

  constructor(
    @Inject(BET_REPOSITORY)
    private readonly betRepository: IBetRepository,
  ) {}

  /**
   * Returns a paginated list of bets placed by the given player, ordered by most recent first.
   *
   * @param playerId - Keycloak subject claim of the authenticated player.
   * @param limit    - Maximum number of items to return.
   * @param offset   - Number of items to skip (for pagination).
   * @returns Object containing the bet array and the total count across all pages.
   */
  execute(playerId: string, limit: number, offset: number): Promise<{ bets: Bet[]; total: number }> {
    this.logger.debug(`Fetching bet history for player=${playerId} limit=${limit} offset=${offset}`);
    return this.betRepository.findByPlayerId(playerId, limit, offset);
  }
}
