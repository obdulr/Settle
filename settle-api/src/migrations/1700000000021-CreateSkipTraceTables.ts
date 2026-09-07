import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSkipTraceTables1700000000021 implements MigrationInterface {
  name = 'CreateSkipTraceTables1700000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skip_trace_status_enum') THEN
          CREATE TYPE skip_trace_status_enum AS ENUM ('pending', 'success', 'partial', 'failed', 'manual');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "skip_trace_results" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "collection_account_id" uuid NOT NULL,
        "requested_by" uuid,
        "provider" varchar(100) NOT NULL DEFAULT 'manual',
        "status" skip_trace_status_enum NOT NULL DEFAULT 'pending',
        "search_criteria" jsonb,
        "addresses" jsonb,
        "phones" jsonb,
        "emails" jsonb,
        "relatives" jsonb,
        "workplaces" jsonb,
        "confidence" decimal(3,2),
        "notes" text,
        "raw_response" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_skip_trace_results_collection_account_id" ON "skip_trace_results" ("collection_account_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_skip_trace_results_requested_by" ON "skip_trace_results" ("requested_by");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_skip_trace_results_status" ON "skip_trace_results" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "skip_trace_results"`);
    await queryRunner.query(`DROP TYPE IF EXISTS skip_trace_status_enum`);
  }
}
