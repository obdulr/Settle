import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeadQualityTier1700000000006 implements MigrationInterface {
  name = 'AddLeadQualityTier1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "leads"
      ADD COLUMN IF NOT EXISTS "qualityTier" varchar(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "leads"
      DROP COLUMN IF EXISTS "qualityTier"
    `);
  }
}
