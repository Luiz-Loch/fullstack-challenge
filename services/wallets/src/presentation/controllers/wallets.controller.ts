import { Controller, Get, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWalletUseCase } from '@/application/use-cases/create-wallet.use-case';
import { GetMyWalletUseCase } from '@/application/use-cases/get-my-wallet.use-case';
import { KeycloakJwtGuard } from '@/infrastructure/auth/keycloak-jwt.guard';
import { PlayerId } from '@/infrastructure/auth/player-id.decorator';
import { HealthCheckResponseDto } from '../dtos/health-check-response.dto';
import { WalletResponseDto, toWalletResponseDto } from '../dtos/wallet-response.dto';

/** REST controller for the `/wallets` resource. */
@ApiTags('wallets')
@Controller('wallets')
export class WalletsController {
  private readonly logger = new Logger(WalletsController.name);

  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getMyWalletUseCase: GetMyWalletUseCase,
  ) {}

  /** Liveness probe — returns `{ status: "ok" }`. */
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ type: HealthCheckResponseDto })
  check(): HealthCheckResponseDto {
    return { status: 'ok', service: 'wallets' };
  }

  /** Creates a wallet for the authenticated player. Returns 409 if one already exists. */
  @Post()
  @UseGuards(KeycloakJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create wallet for the authenticated player' })
  @ApiCreatedResponse({ type: WalletResponseDto })
  @ApiConflictResponse({ description: 'Wallet already exists for this player' })
  async create(@PlayerId() playerId: string): Promise<WalletResponseDto> {
    this.logger.log(`Creating wallet for player ${playerId}`);
    const wallet = await this.createWalletUseCase.execute(playerId);
    this.logger.log(`Wallet created: ${wallet.id} for player ${playerId}`);
    return toWalletResponseDto(wallet);
  }

  /** Returns the wallet and current balance of the authenticated player. */
  @Get('me')
  @UseGuards(KeycloakJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet and balance of the authenticated player' })
  @ApiOkResponse({ type: WalletResponseDto })
  @ApiNotFoundResponse({ description: 'Wallet not found' })
  async getMe(@PlayerId() playerId: string): Promise<WalletResponseDto> {
    this.logger.log(`Fetching wallet for player ${playerId}`);
    const wallet = await this.getMyWalletUseCase.execute(playerId);
    return toWalletResponseDto(wallet);
  }
}
