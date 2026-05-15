import { Inject, Injectable } from '@nestjs/common';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { Round } from '@/domain';

@Injectable()
export class GetRoundHistoryUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) {}

  execute(limit: number, offset: number): Promise<{ rounds: Round[]; total: number }> {
    return this.roundRepository.findHistory(limit, offset);
  }
}
