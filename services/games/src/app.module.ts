import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesController } from './presentation/controllers/games.controller';
import { PostgresConfigService } from './infrastructure/database/postgres-config.service';
import { RoundOrmEntity } from './infrastructure/persistence/round.orm-entity';
import { BetOrmEntity } from './infrastructure/persistence/bet.orm-entity';
import { RoundTypeOrmRepository } from './infrastructure/persistence/round.typeorm-repository';
import { BetTypeOrmRepository } from './infrastructure/persistence/bet.typeorm-repository';
import { ROUND_REPOSITORY } from './domain/ports/round.repository';
import { BET_REPOSITORY } from './domain/ports/bet.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: PostgresConfigService }),
    TypeOrmModule.forFeature([RoundOrmEntity, BetOrmEntity]),
  ],
  controllers: [GamesController],
  providers: [
    RoundTypeOrmRepository,
    { provide: ROUND_REPOSITORY, useExisting: RoundTypeOrmRepository },
    BetTypeOrmRepository,
    { provide: BET_REPOSITORY, useExisting: BetTypeOrmRepository },
  ],
})
export class AppModule {}
