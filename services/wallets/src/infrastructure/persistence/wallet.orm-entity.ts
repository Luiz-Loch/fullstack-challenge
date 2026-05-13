import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wallets')
export class WalletOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'player_id', type: 'uuid', unique: true, nullable: false })
  playerId: string;

  // pg driver returns BIGINT columns as string — converted to bigint in toDomain()
  @Column({ name: 'balance_cents', type: 'bigint' })
  balanceCents: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: false })
  updatedAt: Date;

}
