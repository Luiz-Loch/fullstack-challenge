import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from '@/domain/round.aggregate';
import { Bet } from '@/domain/bet.entity';
import { IRoundRepository } from '@/domain/ports/round.repository';
import { RoundOrmEntity } from './round.orm-entity';
import { BetOrmEntity } from './bet.orm-entity';

@Injectable()
export class RoundTypeOrmRepository
    implements IRoundRepository {

  private readonly logger = new Logger(RoundTypeOrmRepository.name);

  constructor(
    @InjectRepository(RoundOrmEntity)
    private readonly repository: Repository<RoundOrmEntity>,
  ) { }
  
  save(round: Round): Promise<void> {
    throw new Error('Method not implemented.');
  }

}
