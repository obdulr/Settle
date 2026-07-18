import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchEmailSentAtAndProviderEmailVerified1700000000008 implements MigrationInterface {
  name = 'AddMatchEmailSentAtAndProviderEmailVerified1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "matches" ADD COLUMN "email_sent_at" timestamp NULL`);
    await queryRunner.query(`ALTER TABLE "providers" ADD COLUMN "email_verified" boolean DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "email_sent_at"`);
    await queryRunner.query(`ALTER TABLE "providers" DROP COLUMN "email_verified"`);
  }
}
