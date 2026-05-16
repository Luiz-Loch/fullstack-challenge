import { Injectable } from '@nestjs/common';
import { Wallet } from '@/domain/wallet.aggregate';
import { WalletOrmEntity } from '../wallet.orm-entity';

/** Maps between {@link Wallet} aggregate and {@link WalletOrmEntity}. */
@Injectable()
export class WalletMapper {
  toDomain(entity: WalletOrmEntity): Wallet {
    return Wallet.reconstitute(entity.id, entity.playerId, BigInt(entity.balanceCents));
  }

  toOrm(wallet: Wallet): WalletOrmEntity {
    const entity = new WalletOrmEntity();
    entity.id = wallet.id;
    entity.playerId = wallet.playerId;
    entity.balanceCents = wallet.balance.amount.toString();
    return entity;
  }
}
