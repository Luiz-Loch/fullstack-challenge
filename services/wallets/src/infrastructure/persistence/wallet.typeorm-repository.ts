import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '@/domain/wallet.entity';
import { IWalletRepository } from '@/domain/ports/wallet.repository';
import { WalletOrmEntity } from './wallet.orm-entity';

@Injectable()
export class WalletTypeOrmRepository
    implements IWalletRepository {

  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly repo: Repository<WalletOrmEntity>,
  ) {}

  async save(wallet: Wallet): Promise<void> {
    await this.repo.save({
      id: wallet.id,
      playerId: wallet.playerId,
      balanceCents: wallet.balance.amount.toString(),
    });
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const row = await this.repo.findOneBy({ playerId });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<Wallet | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: WalletOrmEntity): Wallet {
    return Wallet.reconstitute(row.id, row.playerId, BigInt(row.balanceCents));
  }

}
