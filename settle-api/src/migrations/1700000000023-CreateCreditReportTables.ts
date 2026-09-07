import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreditReportTables1700000000023 implements MigrationInterface {
  name = 'CreateCreditReportTables1700000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_report_status_enum') THEN
          CREATE TYPE credit_report_status_enum AS ENUM ('pending', 'success', 'failed', 'manual');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_report_provider_enum') THEN
          CREATE TYPE credit_report_provider_enum AS ENUM ('equifax', 'experian', 'transunion', 'manual');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credit_reports" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "collection_account_id" uuid NOT NULL,
        "provider" credit_report_provider_enum NOT NULL DEFAULT 'manual',
        "status" credit_report_status_enum NOT NULL DEFAULT 'manual',
        "request_payload" jsonb,
        "credit_score" int,
        "report_date" date,
        "accounts" jsonb,
        "inquiries" jsonb,
        "public_records" jsonb,
        "warnings" jsonb,
        "raw_response" jsonb,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_credit_reports_collection_account_id" ON "credit_reports" ("collection_account_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_credit_reports_status" ON "credit_reports" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "credit_reports"`);
    await queryRunner.query(`DROP TYPE IF EXISTS credit_report_provider_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS credit_report_status_enum`);
  }
}
