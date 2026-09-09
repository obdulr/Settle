import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokens1700000000015 implements MigrationInterface {
  name = 'CreateRefreshTokens1700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "user_agent" varchar(500),
        "ip_address" varchar(100),
        "revoked_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
