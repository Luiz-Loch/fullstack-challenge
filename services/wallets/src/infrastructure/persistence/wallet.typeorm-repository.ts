import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '@/domain/wallet.aggregate';
import { type IWalletRepository } from '@/domain/ports/wallet.repository';
import { WalletOrmEntity } from './wallet.orm-entity';
import { WalletMapper } from './mapper/wallet.mapper';

/** TypeORM implementation of {@link IWalletRepository}. */
@Injectable()
export class WalletTypeOrmRepository
    implements IWalletRepository {

  private readonly logger = new Logger(WalletTypeOrmRepository.name);

  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly repository: Repository<WalletOrmEntity>,
    private readonly walletMapper: WalletMapper,
  ) {}

  /** Saves the wallet row, including the latest balance. */
  async save(wallet: Wallet): Promise<void> {
    this.logger.debug(`Saving wallet id=${wallet.id} player=${wallet.playerId} balance=${wallet.balance.amount}`);
    await this.repository.save(this.walletMapper.toOrm(wallet));
  }

  /** Returns null when no wallet exists for the given playerId. */
  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    this.logger.debug(`Finding wallet by playerId=${playerId}`);
    const entity = await this.repository.findOneBy({ playerId });
    if (!entity) {
      this.logger.debug(`Wallet not found for playerId=${playerId}`);
    }
    return entity ? this.walletMapper.toDomain(entity) : null;
  }

  /** Returns null when no wallet exists for the given id. */
  async findById(id: string): Promise<Wallet | null> {
    this.logger.debug(`Finding wallet by id=${id}`);
    const entity = await this.repository.findOneBy({ id });
    if (!entity) {
      this.logger.debug(`Wallet not found for id=${id}`);
    }
    return entity ? this.walletMapper.toDomain(entity) : null;
  }
}
