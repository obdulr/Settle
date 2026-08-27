import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneOtpColumns1700000000011 implements MigrationInterface {
  name = 'AddPhoneOtpColumns1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phone_verified" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "phone_otp_code" varchar(10),
      ADD COLUMN IF NOT EXISTS "phone_otp_expires" timestamp,
      ADD COLUMN IF NOT EXISTS "phone_otp_attempts" int DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "phone_otp_attempts",
      DROP COLUMN IF EXISTS "phone_otp_expires",
      DROP COLUMN IF EXISTS "phone_otp_code",
      DROP COLUMN IF EXISTS "phone_verified"
    `);
  }
}
