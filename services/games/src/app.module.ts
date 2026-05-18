import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetsController } from './presentation/controllers/bets.controller';
import { GamesController } from './presentation/controllers/games.controller';
import { PostgresConfigService } from './infrastructure/database/postgres-config.service';
import { RoundOrmEntity } from './infrastructure/persistence/round.orm-entity';
import { BetOrmEntity } from './infrastructure/persistence/bet.orm-entity';
import { RoundTypeOrmRepository } from './infrastructure/persistence/round.typeorm-repository';
import { BetTypeOrmRepository } from './infrastructure/persistence/bet.typeorm-repository';
import { ROUND_REPOSITORY } from './domain/ports/round.repository';
import { BET_REPOSITORY } from './domain/ports/bet.repository';
import { PlaceBetUseCase } from './application/use-cases/place-bet.use-case';
import { CashOutUseCase } from './application/use-cases/cash-out.use-case';
import { RoundScheduler } from './application/round.scheduler';
import { ProvablyFair } from './domain/provably-fair';
import { BetMapper } from './infrastructure/persistence/mapper/bet.mapper';
import { RoundMapper } from './infrastructure/persistence/mapper/round.mapper';
import { KeycloakJwtGuard } from './infrastructure/auth/keycloak-jwt.guard';
import { RoundsController } from './presentation/controllers/rounds.controller';
import { GetCurrentRoundUseCase } from './application/use-cases/get-current-round.use-case';
import { GetRoundHistoryUseCase } from './application/use-cases/get-round-history.use-case';
import { GetPlayerBetHistoryUseCase } from './application/use-cases/get-player-bet-history.use-case';
import { VerifyRoundUseCase } from './application/use-cases/verify-round.use-case';
import { WalletClient } from './infrastructure/messaging/wallet.client';
import { GameGateway } from './presentation/gateways/game.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: PostgresConfigService }),
    TypeOrmModule.forFeature([RoundOrmEntity, BetOrmEntity]),
  ],
  controllers: [BetsController, GamesController, RoundsController],
  providers: [
    RoundTypeOrmRepository,
    { provide: ROUND_REPOSITORY, useExisting: RoundTypeOrmRepository },
    BetTypeOrmRepository,
    { provide: BET_REPOSITORY, useExisting: BetTypeOrmRepository },
    BetMapper,
    CashOutUseCase,
    GameGateway,
    GetCurrentRoundUseCase,
    GetPlayerBetHistoryUseCase,
    GetRoundHistoryUseCase,
    KeycloakJwtGuard,
    PlaceBetUseCase,
    ProvablyFair,
    RoundMapper,
    RoundScheduler,
    VerifyRoundUseCase,
    WalletClient,
  ],
})
export class AppModule { }
