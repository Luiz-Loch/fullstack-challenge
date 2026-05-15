import { Injectable } from '@nestjs/common';
import { Round } from '@/domain/round.aggregate';
import { RoundOrmEntity } from '../round.orm-entity';
import { BetMapper } from './bet.mapper';

@Injectable()
export class RoundMapper {
  constructor(private readonly betMapper: BetMapper) {}

  toDomain(entity: RoundOrmEntity): Round {
    return Round.reconstitute(
      entity.id,
      entity.status,
      BigInt(entity.crashPointCentesimals),
      entity.serverSeedHash,
      entity.serverSeed,
      entity.clientSeed,
      entity.startedAt,
      entity.crashedAt,
      entity.createdAt,
      entity.bets.map(b => this.betMapper.toDomain(b, entity.id)),
    );
  }

  toOrm(round: Round): RoundOrmEntity {
    const entity = new RoundOrmEntity();
    entity.id = round.id;
    entity.status = round.status;
    entity.crashPointCentesimals = round.crashPoint.centesimals.toString();
    entity.serverSeedHash = round.serverSeedHash;
    entity.serverSeed = round.serverSeed;
    entity.clientSeed = round.clientSeed;
    entity.startedAt = round.startedAt;
    entity.crashedAt = round.crashedAt;
    entity.createdAt = round.createdAt;
    entity.bets = round.bets.map(bet => this.betMapper.toOrm(bet, entity));
    return entity;
  }
}