import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoundsTable1778803200000
    implements MigrationInterface {

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rounds" (
        "id"                      UUID        NOT NULL,
        "status"                  VARCHAR     NOT NULL,
        "crash_point_centesimals" BIGINT      NOT NULL,
        "server_seed_hash"        VARCHAR     NOT NULL,
        "server_seed"             VARCHAR,
        "client_seed"             VARCHAR     NOT NULL,
        "started_at"              TIMESTAMPTZ,
        "crashed_at"              TIMESTAMPTZ,
        "created_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_rounds_id" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "rounds"`);
  }
}
