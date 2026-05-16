import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from '@/domain/round.aggregate';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { type IRoundRepository } from '@/domain/ports/round.repository';
import { RoundOrmEntity } from './round.orm-entity';
import { RoundMapper } from './mapper/round.mapper';

/** TypeORM implementation of {@link IRoundRepository}. */
@Injectable()
export class RoundTypeOrmRepository
    implements IRoundRepository {

  private readonly logger = new Logger(RoundTypeOrmRepository.name);

  constructor(
    @InjectRepository(RoundOrmEntity)
    private readonly repository: Repository<RoundOrmEntity>,
    private readonly roundMapper: RoundMapper,
  ) { }

  async save(round: Round): Promise<void> {
    this.logger.debug(`Saving round id=${round.id} status=${round.status} bets=${round.bets.length}`);
    await this.repository.save(this.roundMapper.toOrm(round));
  }

  async findById(id: string): Promise<Round | null> {
    this.logger.debug(`Finding round id=${id}`);
    const entity = await this.repository.findOne({ where: { id }, relations: ['bets'] });
    if (!entity) this.logger.debug(`Round not found id=${id}`);
    return entity ? this.roundMapper.toDomain(entity) : null;
  }

  /** Returns the active round (BETTING or RUNNING), or null if none exists. */
  async findCurrent(): Promise<Round | null> {
    const entity = await this.repository.findOne({
      where: [{ status: RoundStatus.BETTING }, { status: RoundStatus.RUNNING }],
      order: { createdAt: 'DESC' },
      relations: ['bets'],
    });
    return entity ? this.roundMapper.toDomain(entity) : null;
  }

  /** Returns CRASHED rounds in reverse chronological order. */
  async findHistory(limit: number, offset: number): Promise<{ rounds: Round[]; total: number }> {
    this.logger.debug(`Finding round history limit=${limit} offset=${offset}`);
    const [entities, total] = await this.repository.findAndCount({
      where: { status: RoundStatus.CRASHED },
      order: { crashedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { rounds: entities.map(e => this.roundMapper.toDomain(e)), total };
  }

}
