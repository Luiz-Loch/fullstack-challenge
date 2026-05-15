import { Injectable } from '@nestjs/common';
import { Bet } from '@/domain/bet.entity';
import { BetOrmEntity } from '../bet.orm-entity';
import { RoundOrmEntity } from '../round.orm-entity';

@Injectable()
export class BetMapper {
  toDomain(entity: BetOrmEntity, roundId: string): Bet {
    return Bet.reconstitute(
      entity.id,
      roundId,
      entity.playerId,
      BigInt(entity.amountCents),
      entity.status,
      entity.payoutCents !== null ? BigInt(entity.payoutCents) : null,
      entity.cashedOutAt,
      entity.placedAt,
    );
  }

  toOrm(bet: Bet, roundEntity: RoundOrmEntity): BetOrmEntity {
    const entity = new BetOrmEntity();
    entity.id = bet.id;
    entity.round = roundEntity;
    entity.playerId = bet.playerId;
    entity.amountCents = bet.amount.amount.toString();
    entity.status = bet.status;
    entity.payoutCents = bet.payout !== null ? bet.payout.amount.toString() : null;
    entity.cashedOutAt = bet.cashedOutAt;
    entity.placedAt = bet.placedAt;
    return entity;
  }
}