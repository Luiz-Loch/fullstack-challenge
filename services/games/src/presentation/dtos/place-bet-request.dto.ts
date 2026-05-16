import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class PlaceBetRequestDto {
  @IsInt()
  @Min(100)
  @Max(100_000)
  @ApiProperty({ description: 'Bet amount in cents (min R$1,00 = 100, max R$1.000,00 = 100000)', example: 1000 })
  amountCents!: number;
}
