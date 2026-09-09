import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderStripeColumns1700000000018 implements MigrationInterface {
  name = 'AddProviderStripeColumns1700000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "providers"
      ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "subscription_status" varchar(50),
      ADD COLUMN IF NOT EXISTS "subscription_tier" varchar(50),
      ADD COLUMN IF NOT EXISTS "subscription_seats" int,
      ADD COLUMN IF NOT EXISTS "current_period_end" timestamp,
      ADD COLUMN IF NOT EXISTS "cancel_at_period_end" boolean DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "providers"
      DROP COLUMN IF EXISTS "cancel_at_period_end",
      DROP COLUMN IF EXISTS "current_period_end",
      DROP COLUMN IF EXISTS "subscription_seats",
      DROP COLUMN IF EXISTS "subscription_tier",
      DROP COLUMN IF EXISTS "subscription_status",
      DROP COLUMN IF EXISTS "stripe_subscription_id",
      DROP COLUMN IF EXISTS "stripe_customer_id"
    `);
  }
}
