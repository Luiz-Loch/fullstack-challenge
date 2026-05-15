import { Controller, Get, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { GetCurrentRoundUseCase } from '@/application/use-cases/get-current-round.use-case';
import { GetRoundHistoryUseCase } from '@/application/use-cases/get-round-history.use-case';
import { VerifyRoundUseCase } from '@/application/use-cases/verify-round.use-case';
import { RoundCurrentResponseDto, toRoundCurrentResponseDto } from '../dtos/round-current-response.dto';

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

}
