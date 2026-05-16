import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { GetPlayerBetHistoryUseCase } from '@/application/use-cases/get-player-bet-history.use-case';
import { KeycloakJwtGuard } from '@/infrastructure/auth/keycloak-jwt.guard';
import { PlayerId } from '@/infrastructure/auth/player-id.decorator';
import { BetHistoryItemDto, toBetHistoryItemDto } from '../dtos/bet-history-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';

@ApiTags()
@ApiBearerAuth()
@UseGuards(KeycloakJwtGuard)
@Controller()
export class BetsController {
  private readonly logger = new Logger(BetsController.name);

  constructor(private readonly getPlayerBetHistory: GetPlayerBetHistoryUseCase) {}

  /**
   * Returns a paginated list of bets placed by the authenticated player, ordered by most recent first.
   * Requires a valid Keycloak Bearer token — the player id is extracted from the JWT `sub` claim.
   */
  @Get('bets/me')
  @ApiOperation({ summary: "Get the authenticated player's bet history (paginated)" })
  @ApiOkResponse({ description: 'Paginated list of bets', type: PaginatedResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  async getMyBets(
    @PlayerId() playerId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<BetHistoryItemDto>> {
    const offset = (query.page - 1) * query.limit;

    this.logger.log(`GET /bets/me — playerId=${playerId} page=${query.page} limit=${query.limit} offset=${offset}`);

    const { bets, total } = await this.getPlayerBetHistory.execute(playerId, query.limit, offset);

    this.logger.debug(`GET /bets/me — total=${total} returned=${bets.length}`);
    return new PaginatedResponseDto(bets.map(toBetHistoryItemDto), total, query.page, query.limit);
  }
}
