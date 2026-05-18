import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { BetStatus } from '../../domain/enums/bet-status.enum';
import { RoundOrmEntity } from './round.orm-entity';

@Entity('bets')
@Index(['round', 'playerId'], { unique: true })
export class BetOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => RoundOrmEntity, (round) => round.bets, { nullable: false, })
  @JoinColumn({ name: 'round_id' })
  round!: Relation<RoundOrmEntity>;

  @Column({ name: 'player_id', type: 'uuid', nullable: false })
  playerId!: string;

  @Column({ type: 'varchar', nullable: false })
  username!: string;

  /** pg driver returns BIGINT as string — convert to bigint in toDomain(). */
  @Column({ name: 'amount_cents', type: 'bigint', nullable: false })
  amountCents!: string;

  @Column({ type: 'varchar', enum: BetStatus, nullable: false })
  status!: BetStatus;

  /** Null while PENDING. 0 if LOST. Actual payout if CASHED_OUT. */
  @Column({ name: 'payout_cents', type: 'bigint', nullable: true })
  payoutCents!: string | null;

  @Column({ name: 'cashed_out_at', type: 'timestamptz', nullable: true })
  cashedOutAt!: Date | null;

  @Column({ name: 'placed_at', type: 'timestamptz', nullable: false })
  placedAt!: Date;
}
