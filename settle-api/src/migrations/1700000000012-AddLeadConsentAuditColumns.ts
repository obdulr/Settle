import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeadConsentAuditColumns1700000000012 implements MigrationInterface {
  name = 'AddLeadConsentAuditColumns1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // TCPA consent audit fields. The leads table already has tcpaConsent,
    // consentLanguage, and consentTimestamp — these add the IP, user agent,
    // and page version needed to prove who consented and from where.
    await queryRunner.query(`
      ALTER TABLE "leads"
      ADD COLUMN IF NOT EXISTS "consent_ip" varchar(64),
      ADD COLUMN IF NOT EXISTS "consent_user_agent" varchar(512),
      ADD COLUMN IF NOT EXISTS "consent_page_version" varchar(64)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "leads"
      DROP COLUMN IF EXISTS "consent_page_version",
      DROP COLUMN IF EXISTS "consent_user_agent",
      DROP COLUMN IF EXISTS "consent_ip"
    `);
  }
}
