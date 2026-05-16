import { Inject, Injectable, Logger } from '@nestjs/common';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { Round } from '@/domain';

@Injectable()
export class GetRoundHistoryUseCase {
    private readonly logger = new Logger(GetRoundHistoryUseCase.name);

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
  ) {}

  /**
   * Returns a paginated list of completed rounds, ordered by most recent first.
   *
   * @param limit  - Maximum number of items to return.
   * @param offset - Number of items to skip (for pagination).
   * @returns Object containing the round array and the total count across all pages.
   */
  execute(limit: number, offset: number): Promise<{ rounds: Round[]; total: number }> {
    this.logger.debug(`Fetching round history limit=${limit} offset=${offset}`);
    return this.roundRepository.findHistory(limit, offset);
  }
}
