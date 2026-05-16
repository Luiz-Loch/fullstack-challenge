import { Controller, Get, Logger, Param, ParseUUIDPipe, Query, UnprocessableEntityException } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { GetCurrentRoundUseCase } from '@/application/use-cases/get-current-round.use-case';
import { GetRoundHistoryUseCase } from '@/application/use-cases/get-round-history.use-case';
import { VerifyRoundUseCase } from '@/application/use-cases/verify-round.use-case';
import { RoundCurrentResponseDto, toRoundCurrentResponseDto } from '../dtos/round-current-response.dto';
import { RoundHistoryItemDto, toRoundHistoryItemDto } from '../dtos/round-history-response.dto';
import { VerifyRoundResponseDto, toVerifyRoundResponseDto } from '../dtos/verify-round-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';

@ApiTags('rounds')
@Controller('rounds')
export class RoundsController {
  private readonly logger = new Logger(RoundsController.name);

  constructor(
    private readonly getCurrentRound: GetCurrentRoundUseCase,
    private readonly getRoundHistory: GetRoundHistoryUseCase,
    private readonly verifyRound: VerifyRoundUseCase,
  ) { }

  /**
   * Returns the current active round snapshot, including the live multiplier and all placed bets.
   * Throws 422 when no round is running (between rounds or before the first one starts).
   */
  @Get('current')
  @ApiOperation({ summary: 'Get the current round state with live multiplier and bets' })
  @ApiOkResponse({ type: RoundCurrentResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'No round is currently active' })
  async getCurrent(): Promise<RoundCurrentResponseDto> {
    this.logger.log('GET /rounds/current');

    const result = await this.getCurrentRound.execute();

    if (!result) {
      this.logger.warn('GET /rounds/current — no active round');
      throw new UnprocessableEntityException('No active round');
    }

    this.logger.log(`GET /rounds/current — roundId=${result.roundId} status=${result.status} bets=${result.bets.length}`);
    return toRoundCurrentResponseDto(result);
  }

  /**
   * Returns a paginated list of completed rounds, ordered by most recent first.
   * Each item includes the crash point and provably fair seeds for verification.
   */
  @Get('history')
  @ApiOperation({ summary: 'Get paginated round history' })
  @ApiOkResponse({ description: 'Paginated list of completed rounds', type: PaginatedResponseDto })
  async getHistory(@Query() query: PaginationQueryDto): Promise<PaginatedResponseDto<RoundHistoryItemDto>> {
    const offset = (query.page - 1) * query.limit;

    this.logger.log(`GET /rounds/history — page=${query.page} limit=${query.limit} offset=${offset}`);

    const { rounds, total } = await this.getRoundHistory.execute(query.limit, offset);

    this.logger.debug(`GET /rounds/history — total=${total} returned=${rounds.length}`);
    return new PaginatedResponseDto(rounds.map(toRoundHistoryItemDto), total, query.page, query.limit);
  }

  /**
   * Returns provably fair verification data for a completed round.
   * The server seed is only revealed after the round crashes — use serverSeedHash to verify pre-round commitment.
   * Throws 404 if the round does not exist, 422 if the round has not crashed yet.
   */
  @Get(':roundId/verify')
  @ApiOperation({ summary: 'Get provably fair verification data for a completed round' })
  @ApiOkResponse({ type: VerifyRoundResponseDto })
  @ApiNotFoundResponse({ description: 'Round not found' })
  @ApiUnprocessableEntityResponse({ description: 'Round has not crashed yet' })
  async verify(@Param('roundId', ParseUUIDPipe) roundId: string): Promise<VerifyRoundResponseDto> {
    this.logger.log(`GET /rounds/${roundId}/verify`);

    const result = await this.verifyRound.execute(roundId);
    this.logger.log(`GET /rounds/${roundId}/verify — verified=${result.verified}`);
    return toVerifyRoundResponseDto(result);
  }

}
