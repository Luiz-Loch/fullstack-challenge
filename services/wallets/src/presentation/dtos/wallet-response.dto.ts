import { ApiProperty } from '@nestjs/swagger';
import type { Wallet } from '@/domain/wallet.entity';

/** API response shape for a player's wallet. */
export class WalletResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string;

  /** Keycloak subject (`sub`) of the owning player. */
  @ApiProperty({ example: 'a1b2c3d4-keycloak-sub-uuid' })
  playerId!: string;

  /** Balance in cents serialized as string to preserve BIGINT precision in JSON. */
  @ApiProperty({ example: '10000', description: 'Balance in cents (BIGINT, serialized as string)' })
  balanceCents!: string;
}

/** Maps a {@link Wallet} aggregate to {@link WalletResponseDto}. */
export function toWalletResponseDto(wallet: Wallet): WalletResponseDto {
  return {
    id: wallet.id,
    playerId: wallet.playerId,
    balanceCents: wallet.balance.amount.toString(),
  };
}
