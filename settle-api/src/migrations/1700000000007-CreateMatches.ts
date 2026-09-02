import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMatches1700000000007_5 implements MigrationInterface {
  name = 'CreateMatches1700000000007_5';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "matches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "lead_id" uuid NOT NULL,
        "provider_id" uuid NOT NULL,
        "matchScore" int NOT NULL,
        "matchReasons" text,
        "status" varchar(50) DEFAULT 'suggested',
        "viewedAt" timestamp,
        "requestedAt" timestamp,
        "declinedAt" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "UQ_matches_lead_provider" UNIQUE ("lead_id", "provider_id"),
        CONSTRAINT "fk_matches_lead" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_matches_provider" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_matches_lead_id" ON "matches"("lead_id")`);
    await queryRunner.query(`CREATE INDEX "idx_matches_provider_id" ON "matches"("provider_id")`);
    await queryRunner.query(`CREATE INDEX "idx_matches_status" ON "matches"("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "matches"`);
  }
}
