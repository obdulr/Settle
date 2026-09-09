import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBackgroundCheckTables1700000000024 implements MigrationInterface {
  name = 'CreateBackgroundCheckTables1700000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'background_check_status_enum') THEN
          CREATE TYPE background_check_status_enum AS ENUM ('pending', 'success', 'failed', 'manual');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'background_check_provider_enum') THEN
          CREATE TYPE background_check_provider_enum AS ENUM ('checkr', 'first_advantage', 'sterling', 'manual');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "background_checks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "collection_account_id" uuid NOT NULL,
        "provider" background_check_provider_enum NOT NULL DEFAULT 'manual',
        "status" background_check_status_enum NOT NULL DEFAULT 'manual',
        "request_payload" jsonb,
        "criminal_records" jsonb,
        "civil_records" jsonb,
        "employment_verification" jsonb,
        "education_verification" jsonb,
        "address_history" jsonb,
        "sex_offender_status" varchar(50),
        "global_watchlist" jsonb,
        "adverse_action_required" boolean NOT NULL DEFAULT false,
        "raw_response" jsonb,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_background_checks_collection_account_id" ON "background_checks" ("collection_account_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_background_checks_status" ON "background_checks" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "background_checks"`);
    await queryRunner.query(`DROP TYPE IF EXISTS background_check_provider_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS background_check_status_enum`);
  }
}
