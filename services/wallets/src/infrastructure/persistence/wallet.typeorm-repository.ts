import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '@/domain/wallet.aggregate';
import { IWalletRepository } from '@/domain/ports/wallet.repository';
import { WalletOrmEntity } from './wallet.orm-entity';

/** TypeORM implementation of {@link IWalletRepository}. */
@Injectable()
export class WalletTypeOrmRepository
    implements IWalletRepository {

  private readonly logger = new Logger(WalletTypeOrmRepository.name);

  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly repository: Repository<WalletOrmEntity>,
  ) {}

  /** Saves the wallet row, including the latest balance. */
  async save(wallet: Wallet): Promise<void> {
    await this.repository.save({
      id: wallet.id,
      playerId: wallet.playerId,
      balanceCents: wallet.balance.amount.toString(),
    }).catch((err: Error) => {
      this.logger.error(`Failed to save wallet ${wallet.id}: ${err.message}`, err.stack);
      throw err;
    });
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.repository.findOneBy({ playerId })
      .then(row => row ? this.toDomain(row) : null)
      .catch((err: Error) => {
        this.logger.error(`Failed to query wallet by playerId ${playerId}: ${err.message}`, err.stack);
        throw err;
      });
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.repository.findOneBy({ id })
      .then(row => row ? this.toDomain(row) : null)
      .catch((err: Error) => {
        this.logger.error(`Failed to query wallet by id ${id}: ${err.message}`, err.stack);
        throw err;
      });
  }

  /** Maps a raw ORM row back to the {@link Wallet} aggregate without emitting events. */
  private toDomain(row: WalletOrmEntity): Wallet {
    return Wallet.reconstitute(row.id, row.playerId, BigInt(row.balanceCents));
  }
}
