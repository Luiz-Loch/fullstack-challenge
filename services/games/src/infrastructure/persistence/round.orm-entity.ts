import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, type Relation } from 'typeorm';
import { RoundStatus } from '../../domain/enums/round-status.enum';
import { BetOrmEntity } from './bet.orm-entity';

@Entity('rounds')
export class RoundOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', enum: RoundStatus, nullable: false })
  status!: RoundStatus;

  /** pg driver returns BIGINT as string — convert to bigint in toDomain(). */
  @Column({ name: 'crash_point_centesimals', type: 'bigint', nullable: false })
  crashPointCentesimals!: string;

  @Column({ name: 'server_seed_hash', type: 'varchar', nullable: false })
  serverSeedHash!: string;

  /** Null until the round crashes. */
  @Column({ name: 'server_seed', type: 'varchar', nullable: true })
  serverSeed!: string | null;

  @Column({ name: 'client_seed', type: 'varchar', nullable: false })
  clientSeed!: string;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'crashed_at', type: 'timestamptz', nullable: true })
  crashedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => BetOrmEntity, (bet) => bet.round, { eager: true })
  bets!: Relation<BetOrmEntity[]>;
}
