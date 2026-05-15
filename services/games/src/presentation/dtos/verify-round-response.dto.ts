import { ApiProperty } from '@nestjs/swagger';
import type { VerifyRoundResult } from '@/application/use-cases/verify-round.use-case';

export class VerifyRoundResponseDto {
  @ApiProperty() roundId!: string;
  @ApiProperty() serverSeed!: string;
  @ApiProperty() serverSeedHash!: string;
  @ApiProperty() clientSeed!: string;
  @ApiProperty({ description: 'Crash point as centesimals string', example: '150' }) crashPoint!: string;
  @ApiProperty({ description: 'True when the recomputed crash point matches the committed hash' }) verified!: boolean;
}

export function toVerifyRoundResponseDto(result: VerifyRoundResult): VerifyRoundResponseDto {
  return {
    roundId: result.roundId,
    serverSeed: result.serverSeed,
    serverSeedHash: result.serverSeedHash,
    clientSeed: result.clientSeed,
    crashPoint: result.crashPointCentesimals.toString(),
    verified: result.verified,
  };
}
