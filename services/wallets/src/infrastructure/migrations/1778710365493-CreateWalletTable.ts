import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWalletTable1778630400000
    implements MigrationInterface {

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wallets" (
        "id"            UUID        NOT NULL,
        "player_id"     UUID        NOT NULL,
        "balance_cents" BIGINT      NOT NULL DEFAULT 0,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_wallets_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wallets_player_id" UNIQUE      ("player_id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);
  }

}
