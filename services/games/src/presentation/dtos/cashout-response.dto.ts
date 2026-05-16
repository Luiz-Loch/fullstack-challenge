import { ApiProperty } from '@nestjs/swagger';
import type { CashOutResult } from '@/application/use-cases/cash-out.use-case';

export class CashOutResponseDto {
  @ApiProperty() betId!: string;
  @ApiProperty() roundId!: string;
  @ApiProperty({ description: 'Payout amount in cents', example: '2500' }) payoutCents!: string;
  @ApiProperty() cashedOutAt!: Date;
}

export function toCashOutResponseDto(result: CashOutResult): CashOutResponseDto {
  return {
    betId: result.betId,
    roundId: result.roundId,
    payoutCents: result.payoutCents.amount.toString(),
    cashedOutAt: result.cashedOutAt,
  };
}
