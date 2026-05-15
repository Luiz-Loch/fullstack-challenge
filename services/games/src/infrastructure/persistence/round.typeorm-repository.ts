import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from '@/domain/round.aggregate';
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

  /** Saves the round and its bets via cascade. */
  async save(round: Round): Promise<void> {
    this.logger.debug(`Saving round id=${round.id} status=${round.status} bets=${round.bets.length}`);
    await this.repository.save(this.roundMapper.toOrm(round));
  }

  /** Returns null when no round exists with the given id. */
  async findById(id: string): Promise<Round | null> {
    this.logger.debug(`Finding round id=${id}`);
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      this.logger.debug(`Round not found id=${id}`);
    }
    return entity ? this.roundMapper.toDomain(entity) : null;
  }
}