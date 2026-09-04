import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferences1700000000012 implements MigrationInterface {
  name = 'AddNotificationPreferences1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "email_notifications" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "sms_notifications" boolean DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "sms_notifications",
      DROP COLUMN IF EXISTS "email_notifications"
    `);
  }
}
