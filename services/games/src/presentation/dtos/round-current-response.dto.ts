import { ApiProperty } from '@nestjs/swagger';
import type { Bet } from '@/domain/bet.entity';
import type { CurrentRound } from '@/application/use-cases/get-current-round.use-case';

class BetInRoundDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: '1000' }) amountCents!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ nullable: true, example: '1230' }) payoutCents!: string | null;
  @ApiProperty({ nullable: true }) cashedOutAt!: Date | null;
}

export class RoundCurrentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ description: 'Current multiplier as centesimals string', example: '123' }) multiplier!: string;
  @ApiProperty() serverSeedHash!: string;
  @ApiProperty({ type: [BetInRoundDto] }) bets!: BetInRoundDto[];
}

function toBetInRoundDto(bet: Bet): BetInRoundDto {
  return {
    id: bet.id,
    amountCents: bet.amount.amount.toString(),
    status: bet.status,
    payoutCents: bet.payout !== null ? bet.payout!.amount.toString() : null,
    cashedOutAt: bet.cashedOutAt,
  };
}

export function toRoundCurrentResponseDto(result: CurrentRound): RoundCurrentResponseDto {
  return {
    id: result.roundId,
    status: result.status,
    multiplier: result.multiplier.centesimals.toString(),
    serverSeedHash: result.serverSeedHash,
    bets: result.bets.map(toBetInRoundDto),
  };

}
