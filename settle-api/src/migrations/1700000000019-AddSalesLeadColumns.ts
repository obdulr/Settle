import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesLeadColumns1700000000019 implements MigrationInterface {
  name = 'AddSalesLeadColumns1700000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "leads"
      ADD COLUMN IF NOT EXISTS "sales_agent_id" uuid,
      ADD COLUMN IF NOT EXISTS "sales_notes" text,
      ADD COLUMN IF NOT EXISTS "converted_at" timestamp,
      ADD COLUMN IF NOT EXISTS "sales_agent_assigned_at" timestamp
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_leads_sales_agent_id" ON "leads" ("sales_agent_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_leads_sales_agent_id"`);
    await queryRunner.query(`
      ALTER TABLE "leads"
      DROP COLUMN IF EXISTS "sales_agent_assigned_at",
      DROP COLUMN IF EXISTS "converted_at",
      DROP COLUMN IF EXISTS "sales_notes",
      DROP COLUMN IF EXISTS "sales_agent_id"
    `);
  }
}
