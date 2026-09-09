import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCollectionTables1700000000020 implements MigrationInterface {
  name = 'CreateCollectionTables1700000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collection_account_status_enum') THEN
          CREATE TYPE collection_account_status_enum AS ENUM ('new', 'active', 'contacted', 'payment_plan', 'settled', 'paid_in_full', 'litigation', 'charge_off', 'bankruptcy', 'deceased', 'closed');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collection_note_type_enum') THEN
          CREATE TYPE collection_note_type_enum AS ENUM ('call', 'email', 'sms', 'letter', 'payment', 'skip_trace', 'legal', 'credit_report', 'background_check', 'general');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bankruptcy_status_enum') THEN
          CREATE TYPE bankruptcy_status_enum AS ENUM ('none', 'pending', 'discharged', 'dismissed', 'chapter_7', 'chapter_11', 'chapter_13');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collection_accounts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "account_number" varchar(255),
        "crm_client_id" uuid NOT NULL,
        "creditor_id" uuid,
        "debt_buyer_id" uuid,
        "original_balance" decimal(12,2) NOT NULL DEFAULT 0,
        "current_balance" decimal(12,2) NOT NULL DEFAULT 0,
        "interest_rate" decimal(5,2),
        "monthly_payment" decimal(12,2),
        "status" collection_account_status_enum NOT NULL DEFAULT 'new',
        "priority" int NOT NULL DEFAULT 2,
        "delinquency_days" int NOT NULL DEFAULT 0,
        "last_payment_date" date,
        "statute_of_limitations_date" date,
        "charged_off_date" date,
        "assigned_to" uuid,
        "notes" text,
        "custom_fields" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_collection_accounts_crm_client_id" ON "collection_accounts" ("crm_client_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_collection_accounts_creditor_id" ON "collection_accounts" ("creditor_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_collection_accounts_assigned_to" ON "collection_accounts" ("assigned_to");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_collection_accounts_status" ON "collection_accounts" ("status");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "debtor_profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "crm_client_id" uuid NOT NULL UNIQUE,
        "date_of_birth" date,
        "ssn_last4" varchar(4),
        "aliases" text[] NOT NULL DEFAULT '{}',
        "employer_name" varchar(255),
        "employer_phone" varchar(30),
        "occupation" varchar(255),
        "spouse_name" varchar(255),
        "address_history" jsonb,
        "bankruptcy_status" bankruptcy_status_enum NOT NULL DEFAULT 'none',
        "deceased_date" date,
        "do_not_call" boolean NOT NULL DEFAULT false,
        "litigious_flag" boolean NOT NULL DEFAULT false,
        "notes" text,
        "custom_fields" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_debtor_profiles_crm_client_id" ON "debtor_profiles" ("crm_client_id");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collection_notes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "collection_account_id" uuid NOT NULL,
        "author_id" uuid,
        "note_type" collection_note_type_enum NOT NULL DEFAULT 'general',
        "content" text NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_collection_notes_collection_account_id" ON "collection_notes" ("collection_account_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_collection_notes_author_id" ON "collection_notes" ("author_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_collection_notes_note_type" ON "collection_notes" ("note_type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "collection_notes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "debtor_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "collection_accounts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS bankruptcy_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS collection_note_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS collection_account_status_enum`);
  }
}
