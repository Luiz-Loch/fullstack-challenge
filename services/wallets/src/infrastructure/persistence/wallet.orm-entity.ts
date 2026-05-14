import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/** TypeORM entity mapping the `wallets` table. Never used outside the persistence layer. */
@Entity('wallets')
export class WalletOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  /** Keycloak subject (`sub`) — one wallet per player, enforced by unique constraint. */
  @Column({ name: 'player_id', type: 'uuid', unique: true, nullable: false })
  playerId!: string;

  // pg driver returns BIGINT columns as string — converted to bigint in toDomain()
  @Column({ name: 'balance_cents', type: 'bigint' })
  balanceCents!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: false })
  updatedAt!: Date;
}
