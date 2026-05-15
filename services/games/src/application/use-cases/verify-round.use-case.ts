import { Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { type IRoundRepository, ROUND_REPOSITORY } from '@/domain/ports/round.repository';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { ProvablyFair } from '@/domain/provably-fair';

export interface VerifyRoundResult {
  roundId: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  crashPointCentesimals: bigint;
  verified: boolean;
}

@Injectable()
export class VerifyRoundUseCase {
  private readonly logger = new Logger(VerifyRoundUseCase.name);
  
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: IRoundRepository,
    private readonly provablyFair: ProvablyFair,
  ) { }

  /**
   * Returns provably fair verification data for a completed round.
   * Recomputes the crash point from the revealed server seed and confirms it matches
   * both the published commitment (SHA-256 hash) and the stored crash point.
   *
   * @throws {NotFoundException} If no round exists with the given id.
   * @throws {UnprocessableEntityException} If the round has not crashed yet — the server seed is only revealed at crash time.
   */
  async execute(roundId: string): Promise<VerifyRoundResult> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      this.logger.warn(`Round not found: roundId=${roundId}`);
      throw new NotFoundException(`Round ${roundId} not found`);
    }

    if (round.status !== RoundStatus.CRASHED) {
      this.logger.warn(`Verification attempted on non-crashed round: roundId=${roundId} status=${round.status}`);
      throw new UnprocessableEntityException('Server seed is only revealed after the round crashes');
    }

    const serverSeed = round.serverSeed!;
    const verified = this.provablyFair.verify(
      serverSeed,
      round.clientSeed,
      round.serverSeedHash,
      round.crashPoint,
    );

    this.logger.log(`Round verified: roundId=${roundId} verified=${verified}`);
    return {
      roundId: round.id,
      serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      crashPointCentesimals: round.crashPoint.centesimals,
      verified,
    };
  }

}
