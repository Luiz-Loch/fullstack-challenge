import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsController } from './presentation/controllers/wallets.controller';
import { PostgresConfigService } from './infrastructure/database/postgres-config.service';
import { WalletOrmEntity } from './infrastructure/persistence/wallet.orm-entity';
import { WalletTypeOrmRepository } from './infrastructure/persistence/wallet.typeorm-repository';
import { WALLET_REPOSITORY } from './domain/ports/wallet.repository';
import { CreateWalletUseCase } from './application/use-cases/create-wallet.use-case';
import { GetMyWalletUseCase } from './application/use-cases/get-my-wallet.use-case';
import { KeycloakJwtGuard } from './infrastructure/auth/keycloak-jwt.guard';
import { WalletMapper } from './infrastructure/persistence/mapper/wallet.mapper';

/** Root module for the Wallet Service. Wires together persistence, use cases and the HTTP layer. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: PostgresConfigService }),
    TypeOrmModule.forFeature([WalletOrmEntity]),
  ],
  controllers: [WalletsController],
  providers: [
    WalletMapper,
    WalletTypeOrmRepository,
    { provide: WALLET_REPOSITORY, useExisting: WalletTypeOrmRepository},
    CreateWalletUseCase,
    GetMyWalletUseCase,
    KeycloakJwtGuard,
  ],
})
export class AppModule {}
