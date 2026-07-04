import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDebts1700000000003 implements MigrationInterface {
  name = 'CreateDebts1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "debts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "creditor" varchar(100) NOT NULL,
        "balance" decimal(10,2) NOT NULL,
        "original_balance" decimal(10,2),
        "interest_rate" decimal(5,2),
        "due_date" date,
        "type" varchar(50) DEFAULT 'credit_card',
        "status" varchar(50) DEFAULT 'active',
        "notes" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_debts_user_id" ON "debts"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_debts_status" ON "debts"("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_debts_type" ON "debts"("type")
    `);

    await queryRunner.query(`
      ALTER TABLE "debts" 
      ADD CONSTRAINT "fk_debts_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "debts"`);
  }
}