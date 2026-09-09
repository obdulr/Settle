import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCrmTables1700000000013 implements MigrationInterface {
  name = 'CreateCrmTables1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLeads = await queryRunner.hasTable('crm_leads');
    if (hasLeads) {
      return;
    }

    // crm_clients — provider-side CRM contacts (providers themselves are
    // stored as clients when they purchase leads).
    await queryRunner.query(`
      CREATE TABLE "crm_clients" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "phone" varchar,
        "company" varchar,
        "job_title" varchar,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "lifecycle_stage" varchar(20) NOT NULL DEFAULT 'awareness',
        "source" varchar NOT NULL,
        "tags" text[] DEFAULT '{}',
        "total_value" decimal(12,2) DEFAULT 0,
        "last_contact" timestamp,
        "next_follow_up" timestamp,
        "assigned_to" varchar,
        "preferences" jsonb,
        "customFields" jsonb,
        "user_id" varchar NOT NULL,
        "group_id" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_crm_clients_user_id" ON "crm_clients"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_crm_clients_group_id" ON "crm_clients"("group_id")`);

    // crm_leads — consumer assessment leads synced into the CRM pipeline.
    // Enum columns use varchar with a CHECK constraint for portability across
    // Postgres versions that may not have the enum type pre-created.
    await queryRunner.query(`
      CREATE TABLE "crm_leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "phone" varchar,
        "company" varchar,
        "job_title" varchar,
        "source" varchar(30) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'new',
        "score" int DEFAULT 0,
        "ai_score" decimal(5,2),
        "ai_grade" varchar(2),
        "aiInsights" text[] DEFAULT '{}',
        "ai_recommended_actions" text[] DEFAULT '{}',
        "last_scored_at" timestamp,
        "webinar_attendance" boolean DEFAULT false,
        "pricing_page_visits" int DEFAULT 0,
        "email_opens" int DEFAULT 0,
        "email_clicks" int DEFAULT 0,
        "website_visits" int DEFAULT 0,
        "content_downloads" int DEFAULT 0,
        "form_submissions" int DEFAULT 0,
        "demo_requests" int DEFAULT 0,
        "user_id" varchar NOT NULL,
        "consumer_lead_id" uuid,
        "group_id" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_crm_leads_user_id" ON "crm_leads"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_crm_leads_group_id" ON "crm_leads"("group_id")`);

    // crm_deals — pipeline deals tied to a client (e.g. a lead purchase).
    await queryRunner.query(`
      CREATE TABLE "crm_deals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar NOT NULL,
        "description" text,
        "client_id" uuid NOT NULL,
        "contact_id" uuid,
        "stage" varchar(20) NOT NULL,
        "value" decimal(12,2) NOT NULL,
        "currency" varchar DEFAULT 'USD',
        "probability" int DEFAULT 0,
        "expected_close_date" timestamp,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "won_date" timestamp,
        "lost_date" timestamp,
        "lost_reason" varchar,
        "assigned_to" varchar NOT NULL,
        "tags" text[] DEFAULT '{}',
        "customFields" jsonb,
        "activities" jsonb,
        "user_id" varchar NOT NULL,
        "group_id" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_crm_deals_client_id" ON "crm_deals"("client_id")`);
    await queryRunner.query(`CREATE INDEX "idx_crm_deals_user_id" ON "crm_deals"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_crm_deals_group_id" ON "crm_deals"("group_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_deals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_leads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_clients"`);
  }
}
