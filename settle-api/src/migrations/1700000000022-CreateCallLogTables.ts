import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCallLogTables1700000000022 implements MigrationInterface {
  name = 'CreateCallLogTables1700000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_direction_enum') THEN
          CREATE TYPE call_direction_enum AS ENUM ('inbound', 'outbound');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_status_enum') THEN
          CREATE TYPE call_status_enum AS ENUM ('scheduled', 'dialing', 'ringing', 'answered', 'completed', 'no_answer', 'busy', 'failed', 'voicemail', 'cancelled');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "call_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "collection_account_id" uuid NOT NULL,
        "agent_id" uuid,
        "phone_number" varchar(30) NOT NULL,
        "direction" call_direction_enum NOT NULL DEFAULT 'outbound',
        "status" call_status_enum NOT NULL DEFAULT 'scheduled',
        "started_at" timestamp,
        "ended_at" timestamp,
        "duration" int,
        "recording_url" text,
        "transcript" text,
        "notes" text,
        "provider" varchar(100) NOT NULL DEFAULT 'telnyx',
        "provider_call_id" varchar(255),
        "cost" decimal(10,4),
        "raw_response" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_call_logs_collection_account_id" ON "call_logs" ("collection_account_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_call_logs_agent_id" ON "call_logs" ("agent_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_call_logs_status" ON "call_logs" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "call_logs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS call_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS call_direction_enum`);
  }
}
