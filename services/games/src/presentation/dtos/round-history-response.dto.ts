import { ApiProperty } from '@nestjs/swagger';
import type { Round } from '@/domain/round.aggregate';

export class RoundHistoryItemDto {
  @ApiProperty() id!: string;
  @ApiProperty({ description: 'Crash point as centesimals string', example: '150' }) crashPoint!: string;
  @ApiProperty() serverSeedHash!: string;
  @ApiProperty({ nullable: true }) startedAt!: Date | null;
  @ApiProperty({ nullable: true }) crashedAt!: Date | null;
  @ApiProperty() createdAt!: Date;
}

export function toRoundHistoryItemDto(round: Round): RoundHistoryItemDto {
  return {
    id: round.id,
    crashPoint: round.crashPoint.centesimals.toString(),
    serverSeedHash: round.serverSeedHash,
    startedAt: round.startedAt,
    crashedAt: round.crashedAt,
    createdAt: round.createdAt,
  };

}
