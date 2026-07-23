import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingUserColumns1700000000009 implements MigrationInterface {
  name = 'AddMissingUserColumns1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "otp_code" varchar(10),
      ADD COLUMN IF NOT EXISTS "otp_expires" timestamp,
      ADD COLUMN IF NOT EXISTS "otp_attempts" int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "coaching_subscription_status" varchar(50),
      ADD COLUMN IF NOT EXISTS "coaching_current_period_end" timestamp,
      ADD COLUMN IF NOT EXISTS "coaching_cancel_at_period_end" boolean DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "coaching_cancel_at_period_end",
      DROP COLUMN IF EXISTS "coaching_current_period_end",
      DROP COLUMN IF EXISTS "coaching_subscription_status",
      DROP COLUMN IF EXISTS "stripe_subscription_id",
      DROP COLUMN IF EXISTS "stripe_customer_id",
      DROP COLUMN IF EXISTS "otp_attempts",
      DROP COLUMN IF EXISTS "otp_expires",
      DROP COLUMN IF EXISTS "otp_code"
    `);
  }
}
