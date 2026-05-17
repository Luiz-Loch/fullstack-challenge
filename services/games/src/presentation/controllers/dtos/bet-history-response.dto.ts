import { ApiProperty } from '@nestjs/swagger';
import { type Bet } from '@/domain/bet.entity';
import { BetStatus } from '@/domain/enums/bet-status.enum';

export class BetHistoryItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() roundId!: string;
  @ApiProperty({ description: 'Bet amount in cents', example: '1000' }) amount!: string;
  @ApiProperty({ enum: BetStatus }) status!: BetStatus;
  @ApiProperty({ description: 'Payout in cents — null when bet is still PENDING', nullable: true, example: '2500' }) payout!: string | null;
  @ApiProperty({ nullable: true }) cashedOutAt!: Date | null;
  @ApiProperty() placedAt!: Date;
}

export function toBetHistoryItemDto(bet: Bet): BetHistoryItemDto {
  return {
    id: bet.id,
    roundId: bet.roundId,
    amount: bet.amount.amount.toString(),
    status: bet.status,
    payout: bet.payout?.amount.toString() ?? null,
    cashedOutAt: bet.cashedOutAt,
    placedAt: bet.placedAt,
  };
}
