import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBetRepository } from '@/domain/ports/bet.repository';
import { BetOrmEntity } from './bet.orm-entity';

@Injectable()
export class BetTypeOrmRepository
    implements IBetRepository {

  private readonly logger = new Logger(BetTypeOrmRepository.name);

  constructor(
    @InjectRepository(BetOrmEntity)
    private readonly repository: Repository<BetOrmEntity>,
  ) { }

}
