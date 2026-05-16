import { ApiProperty } from '@nestjs/swagger';
import type { PlaceBetResult } from '@/application/use-cases/place-bet.use-case';

export class PlaceBetResponseDto {
  @ApiProperty() betId!: string;
  @ApiProperty() roundId!: string;
  @ApiProperty({ description: 'Bet amount in cents', example: '1000' }) amountCents!: string;
  @ApiProperty() placedAt!: Date;
}

export function toPlaceBetResponseDto(result: PlaceBetResult): PlaceBetResponseDto {
  return {
    betId: result.betId,
    roundId: result.roundId,
    amountCents: result.amountCents.toString(),
    placedAt: result.placedAt,
  };
}
