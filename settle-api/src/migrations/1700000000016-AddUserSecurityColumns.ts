import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSecurityColumns1700000000016 implements MigrationInterface {
  name = 'AddUserSecurityColumns1700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "failed_login_attempts" int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "last_failed_login_at" timestamp,
      ADD COLUMN IF NOT EXISTS "lockout_expires_at" timestamp,
      ADD COLUMN IF NOT EXISTS "account_locked" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "last_password_change_at" timestamp,
      ADD COLUMN IF NOT EXISTS "reset_token" varchar(255),
      ADD COLUMN IF NOT EXISTS "reset_token_expires" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "reset_token_expires",
      DROP COLUMN IF EXISTS "reset_token",
      DROP COLUMN IF EXISTS "last_password_change_at",
      DROP COLUMN IF EXISTS "account_locked",
      DROP COLUMN IF EXISTS "lockout_expires_at",
      DROP COLUMN IF EXISTS "last_failed_login_at",
      DROP COLUMN IF EXISTS "failed_login_attempts"
    `);
  }
}
