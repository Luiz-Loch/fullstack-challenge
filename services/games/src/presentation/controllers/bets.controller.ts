import { Body, ConflictException, Controller, Get, Logger, NotFoundException, Post, Query, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { GetPlayerBetHistoryUseCase } from '@/application/use-cases/get-player-bet-history.use-case';
import { PlaceBetUseCase } from '@/application/use-cases/place-bet.use-case';
import { KeycloakJwtGuard } from '@/infrastructure/auth/keycloak-jwt.guard';
import { PlayerId } from '@/infrastructure/auth/player-id.decorator';
import { BetHistoryItemDto, toBetHistoryItemDto } from '../dtos/bet-history-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { PlaceBetRequestDto } from '../dtos/place-bet-request.dto';
import { PlaceBetResponseDto, toPlaceBetResponseDto } from '../dtos/place-bet-response.dto';

@ApiTags()
@ApiBearerAuth()
@UseGuards(KeycloakJwtGuard)
@Controller()
export class BetsController {
  private readonly logger = new Logger(BetsController.name);

  constructor(
    private readonly getPlayerBetHistory: GetPlayerBetHistoryUseCase,
    private readonly placeBet: PlaceBetUseCase,
  ) { }

  /**
   * Places a bet for the authenticated player in the specified round.
   * The round must be in BETTING state and the player must not have an existing bet in it.
   *
   * @throws {NotFoundException} If the round does not exist.
   * @throws {UnprocessableEntityException} If the round is not accepting bets.
   * @throws {ConflictException} If the player already has a bet in this round.
   */
  @Post('bet')
  @ApiOperation({ summary: 'Place a bet in an active round' })
  @ApiCreatedResponse({ type: PlaceBetResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiNotFoundResponse({ description: 'Round not found' })
  @ApiUnprocessableEntityResponse({ description: 'Round is not in BETTING state' })
  @ApiConflictResponse({ description: 'Player already has a bet in this round' })
  async placeBetHandler(
    @PlayerId() playerId: string,
    @Body() body: PlaceBetRequestDto,
  ): Promise<PlaceBetResponseDto> {
    this.logger.log(`POST /bet — playerId=${playerId} amountCents=${body.amountCents}`);

    const result = await this.placeBet.execute({
      playerId,
      amountCents: BigInt(body.amountCents),
    });

    this.logger.log(`POST /bet — betId=${result.betId} placed`);
    return toPlaceBetResponseDto(result);
  }

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
