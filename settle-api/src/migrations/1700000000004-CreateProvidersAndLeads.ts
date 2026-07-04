import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProvidersAndLeads1700000000004 implements MigrationInterface {
  name = 'CreateProvidersAndLeads1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Providers table
    await queryRunner.query(`
      CREATE TABLE "providers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyName" varchar(200) NOT NULL,
        "email" varchar(100) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "phone" varchar(50),
        "website" varchar(255),
        "logoUrl" varchar(255),
        "description" text,
        "serviceTypes" text,
        "debtTypes" text,
        "statesServed" text,
        "minDebtAmount" decimal(10,2) DEFAULT 7500,
        "maxDebtAmount" decimal(10,2),
        "feePercentage" decimal(5,2),
        "leadPrice" decimal(10,2),
        "bbbRating" varchar(10),
        "avgRating" decimal(3,1),
        "reviewCount" int DEFAULT 0,
        "successfulSettlements" int DEFAULT 0,
        "avgSettlementDays" int,
        "avgSavingsPercentage" decimal(5,2),
        "isAfccMember" boolean DEFAULT false,
        "isIapdaMember" boolean DEFAULT false,
        "yearsInBusiness" int,
        "status" varchar(50) DEFAULT 'pending',
        "subscriptionType" varchar(50) DEFAULT 'pay_per_lead',
        "creditBalance" decimal(10,2) DEFAULT 0,
        "isAcceptingLeads" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_providers_status" ON "providers"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_providers_email" ON "providers"("email")`);

    // Leads table
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "email" varchar(100) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "state" varchar(2) NOT NULL,
        "zipCode" varchar(10),
        "totalDebt" decimal(10,2) NOT NULL,
        "debtTypes" text,
        "employmentStatus" varchar(50),
        "monthlyIncome" decimal(10,2),
        "creditScore" varchar(50),
        "monthsBehind" int,
        "hasFiledBankruptcy" boolean DEFAULT false,
        "qualityScore" int DEFAULT 0,
        "isVerified" boolean DEFAULT false,
        "status" varchar(50) DEFAULT 'new',
        "purchasedBy" uuid,
        "salePrice" decimal(10,2),
        "purchasedAt" timestamp,
        "expiresAt" timestamp,
        "tcpaConsent" boolean DEFAULT false,
        "consentLanguage" text,
        "consentTimestamp" timestamp,
        "source" varchar(100),
        "utm" varchar(200),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_leads_status" ON "leads"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_leads_quality" ON "leads"("qualityScore")`);
    await queryRunner.query(`CREATE INDEX "idx_leads_state" ON "leads"("state")`);
    await queryRunner.query(`CREATE INDEX "idx_leads_purchased_by" ON "leads"("purchasedBy")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "leads"`);
    await queryRunner.query(`DROP TABLE "providers"`);
  }
}