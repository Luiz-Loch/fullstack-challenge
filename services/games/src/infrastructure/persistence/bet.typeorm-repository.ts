import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet } from '@/domain/bet.entity';
import { IBetRepository } from '@/domain/ports/bet.repository';
import { BetOrmEntity } from './bet.orm-entity';
import { RoundOrmEntity } from './round.orm-entity';
import { BetMapper } from './mapper/bet.mapper';

@Injectable()
export class BetTypeOrmRepository implements IBetRepository {
  private readonly logger = new Logger(BetTypeOrmRepository.name);

  constructor(
    @InjectRepository(BetOrmEntity)
    private readonly repository: Repository<BetOrmEntity>,
    private readonly betMapper: BetMapper,
  ) {}

  async save(bet: Bet): Promise<void> {
    this.logger.debug(`Saving bet id=${bet.id} status=${bet.status}`);
    const roundRef = new RoundOrmEntity();
    roundRef.id = bet.roundId;
    await this.repository.save(this.betMapper.toOrm(bet, roundRef));
  }

  async findByPlayerId(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<{ bets: Bet[]; total: number }> {
    this.logger.debug(`Finding bets for player=${playerId} limit=${limit} offset=${offset}`);
    const [entities, total] = await this.repository.findAndCount({
      where: { playerId },
      relations: ['round'],
      order: { placedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return {
      bets: entities.map(e => this.betMapper.toDomain(e, e.round.id)),
      total,
    };
  }

}
