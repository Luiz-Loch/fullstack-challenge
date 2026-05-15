import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBetsTable1778803200001
  implements MigrationInterface {

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bets" (
        "id"            UUID        NOT NULL,
        "round_id"      UUID        NOT NULL,
        "player_id"     UUID        NOT NULL,
        "amount_cents"  BIGINT      NOT NULL,
        "status"        VARCHAR     NOT NULL,
        "payout_cents"  BIGINT,
        "cashed_out_at" TIMESTAMPTZ,
        "placed_at"     TIMESTAMPTZ NOT NULL,

        CONSTRAINT "PK_bets_id" PRIMARY KEY ("id"),

        CONSTRAINT "FK_bets_round_id" FOREIGN KEY ("round_id") REFERENCES "rounds" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_one_bet_per_player_per_round"
      ON "bets" ("round_id", "player_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_one_bet_per_player_per_round"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "bets"`);
  }
}
