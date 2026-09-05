import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDebtSettlementCrmTables1700000000017 implements MigrationInterface {
  name = 'CreateDebtSettlementCrmTables1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================================================
    // Creditors
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "creditors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "category" varchar(100),
        "contact_phone" varchar(50),
        "contact_email" varchar(255),
        "address" text,
        "settlement_department_phone" varchar(50),
        "settlement_department_email" varchar(255),
        "default_settlement_percentage" decimal(5,2),
        "minimum_settlement_percentage" decimal(5,2),
        "typical_settlement_timeframe_days" int,
        "requires_hardship_letter" boolean DEFAULT false,
        "requires_power_of_attorney" boolean DEFAULT false,
        "notes" text,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // =========================================================================
    // Client Enrollments
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_enrollments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL,
        "enrollment_date" timestamp,
        "program_length_months" int,
        "monthly_payment_amount" decimal(12,2),
        "total_enrolled_debt" decimal(12,2),
        "estimated_settlement_amount" decimal(12,2),
        "estimated_total_cost" decimal(12,2),
        "estimated_savings" decimal(12,2),
        "savings_percentage" decimal(5,2),
        "status" varchar(50) DEFAULT 'pending',
        "total_accounts_enrolled" int DEFAULT 0,
        "total_accounts_settled" int DEFAULT 0,
        "total_settled_amount" decimal(12,2) DEFAULT 0,
        "total_paid_amount" decimal(12,2) DEFAULT 0,
        "graduation_date" timestamp,
        "cancellation_date" timestamp,
        "cancellation_reason" text,
        "assigned_agent_id" uuid,
        "notes" text,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_enrollments_client_id" ON "client_enrollments" ("client_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_enrollments_status" ON "client_enrollments" ("status")`);

    // =========================================================================
    // Settlements
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settlements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "enrollment_id" uuid,
        "client_id" uuid NOT NULL,
        "creditor_id" uuid,
        "creditor_name" varchar(255),
        "original_balance" decimal(12,2) NOT NULL,
        "current_balance" decimal(12,2) NOT NULL,
        "settlement_amount" decimal(12,2) NOT NULL,
        "settlement_percentage" decimal(5,2),
        "savings_amount" decimal(12,2),
        "status" varchar(50) DEFAULT 'pending',
        "negotiator_id" uuid,
        "offer_date" timestamp,
        "acceptance_date" timestamp,
        "approval_date" timestamp,
        "funding_date" timestamp,
        "completion_date" timestamp,
        "expiration_date" timestamp,
        "payment_plan" boolean DEFAULT false,
        "number_of_payments" int,
        "first_payment_due_date" timestamp,
        "settlement_letter_url" varchar(500),
        "creditor_account_number" varchar(255),
        "notes" text,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_settlements_enrollment_id" ON "settlements" ("enrollment_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_settlements_client_id" ON "settlements" ("client_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_settlements_status" ON "settlements" ("status")`);

    // =========================================================================
    // Trust Accounts
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trust_accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "enrollment_id" uuid,
        "client_id" uuid NOT NULL,
        "account_number" varchar(255),
        "routing_number" varchar(50),
        "bank_name" varchar(255),
        "current_balance" decimal(12,2) DEFAULT 0,
        "total_deposited" decimal(12,2) DEFAULT 0,
        "total_withdrawn" decimal(12,2) DEFAULT 0,
        "total_fees_deducted" decimal(12,2) DEFAULT 0,
        "monthly_fee" decimal(12,2),
        "status" varchar(50) DEFAULT 'active',
        "opened_date" timestamp,
        "closed_date" timestamp,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_trust_accounts_client_id" ON "trust_accounts" ("client_id")`);

    // =========================================================================
    // Settlement Payments
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settlement_payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "settlement_id" uuid,
        "client_id" uuid NOT NULL,
        "enrollment_id" uuid,
        "trust_account_id" uuid,
        "amount" decimal(12,2) NOT NULL,
        "payment_type" varchar(50),
        "scheduled_date" timestamp,
        "processed_date" timestamp,
        "status" varchar(50) DEFAULT 'scheduled',
        "transaction_id" varchar(255),
        "payment_method" varchar(100),
        "fee_amount" decimal(12,2) DEFAULT 0,
        "notes" text,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_settlement_payments_settlement_id" ON "settlement_payments" ("settlement_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_settlement_payments_client_id" ON "settlement_payments" ("client_id")`);

    // =========================================================================
    // Lead Routing Rules
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lead_routing_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "description" text,
        "priority" int DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "routing_strategy" varchar(50),
        "conditions" jsonb,
        "actions" jsonb,
        "assigned_agent_id" uuid,
        "execution_count" int DEFAULT 0,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // =========================================================================
    // Lead Assignments
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lead_assignments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id" uuid NOT NULL,
        "assigned_agent_id" uuid,
        "assigned_by" uuid,
        "routing_rule_id" uuid,
        "status" varchar(50) DEFAULT 'active',
        "assignment_reason" text,
        "reassigned_from_id" uuid,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_lead_assignments_lead_id" ON "lead_assignments" ("lead_id")`);

    // =========================================================================
    // DNC Entries
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dnc_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone_number" varchar(20) NOT NULL,
        "source" varchar(50),
        "reason" text,
        "expires_at" timestamp,
        "is_permanent" boolean DEFAULT false,
        "added_by" uuid,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_dnc_entries_phone" ON "dnc_entries" ("phone_number")`);

    // =========================================================================
    // Consent Logs
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consent_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id" uuid,
        "client_id" uuid,
        "phone_number" varchar(20),
        "email" varchar(255),
        "consent_type" varchar(50) NOT NULL,
        "consent_given" boolean NOT NULL,
        "consent_text" text,
        "ip_address" varchar(100),
        "user_agent" varchar(500),
        "channel" varchar(50),
        "witnessed_by" uuid,
        "expires_at" timestamp,
        "revoked_at" timestamp,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_consent_logs_lead_id" ON "consent_logs" ("lead_id")`);

    // =========================================================================
    // Communication Logs
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "communication_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id" uuid,
        "client_id" uuid,
        "enrollment_id" uuid,
        "settlement_id" uuid,
        "agent_id" uuid,
        "channel" varchar(50) NOT NULL,
        "direction" varchar(20),
        "subject" varchar(500),
        "body" text,
        "duration_seconds" int,
        "outcome" varchar(100),
        "sentiment" varchar(50),
        "ai_summary" text,
        "ai_action_items" jsonb,
        "ai_follow_up_suggestions" jsonb,
        "phone_number" varchar(20),
        "email_address" varchar(255),
        "call_recording_url" varchar(500),
        "call_transcript" text,
        "consent_log_id" uuid,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_communication_logs_lead_id" ON "communication_logs" ("lead_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_communication_logs_client_id" ON "communication_logs" ("client_id")`);

    // =========================================================================
    // CRM Tasks
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "assigned_to" uuid,
        "lead_id" uuid,
        "client_id" uuid,
        "enrollment_id" uuid,
        "settlement_id" uuid,
        "due_date" timestamp,
        "completed_at" timestamp,
        "priority" varchar(20) DEFAULT 'medium',
        "status" varchar(20) DEFAULT 'pending',
        "reminder_sent" boolean DEFAULT false,
        "reminder_date" timestamp,
        "callback_phone_number" varchar(20),
        "callback_notes" text,
        "metadata" jsonb,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_tasks_assigned_to" ON "crm_tasks" ("assigned_to")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_tasks_due_date" ON "crm_tasks" ("due_date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_tasks_status" ON "crm_tasks" ("status")`);

    // =========================================================================
    // Workflow Rules
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_workflow_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "description" text,
        "is_active" boolean DEFAULT true,
        "trigger_event" varchar(50) NOT NULL,
        "trigger_conditions" jsonb,
        "actions" jsonb NOT NULL,
        "execution_count" int DEFAULT 0,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // =========================================================================
    // Workflow Executions
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_workflow_executions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "rule_id" uuid NOT NULL,
        "status" varchar(20) DEFAULT 'pending',
        "trigger_data" jsonb,
        "action_results" jsonb,
        "lead_id" uuid,
        "client_id" uuid,
        "enrollment_id" uuid,
        "settlement_id" uuid,
        "triggered_at" timestamp NOT NULL,
        "completed_at" timestamp,
        "error" text,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_workflow_executions_rule_id" ON "crm_workflow_executions" ("rule_id")`);

    // =========================================================================
    // CRM Notifications
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "target_role" varchar(20),
        "type" varchar(20) NOT NULL,
        "notification_channel" varchar(20) DEFAULT 'in_app',
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "is_read" boolean DEFAULT false,
        "read_at" timestamp,
        "lead_id" uuid,
        "client_id" uuid,
        "enrollment_id" uuid,
        "settlement_id" uuid,
        "action_url" jsonb,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_notifications_user_id" ON "crm_notifications" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_notifications_client_id" ON "crm_notifications" ("client_id")`);

    // =========================================================================
    // Milestones
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_milestones" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "enrollment_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "milestone_type" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "status" varchar(20) DEFAULT 'pending',
        "sort_order" int DEFAULT 0,
        "progress_threshold" decimal(5,2),
        "target_date" timestamp,
        "reached_date" timestamp,
        "trigger_actions" jsonb,
        "client_visible" boolean DEFAULT true,
        "notes" text,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_milestones_enrollment_id" ON "crm_milestones" ("enrollment_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_milestones_client_id" ON "crm_milestones" ("client_id")`);

    // =========================================================================
    // CRM Documents
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "document_type" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "file_url" varchar(500) NOT NULL,
        "file_name" varchar(255),
        "file_size" int,
        "mime_type" varchar(100),
        "status" varchar(20) DEFAULT 'draft',
        "client_id" uuid NOT NULL,
        "enrollment_id" uuid,
        "settlement_id" uuid,
        "creditor_id" uuid,
        "uploaded_by" uuid NOT NULL,
        "sent_at" timestamp,
        "viewed_at" timestamp,
        "signed_at" timestamp,
        "signature_ip" varchar(64),
        "signature_user_agent" varchar(512),
        "expires_at" timestamp,
        "metadata" jsonb,
        "group_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_documents_client_id" ON "crm_documents" ("client_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_documents_enrollment_id" ON "crm_documents" ("enrollment_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_milestones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_workflow_executions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_workflow_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "communication_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consent_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dnc_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lead_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lead_routing_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settlement_payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "trust_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settlements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_enrollments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "creditors"`);
  }
}
