import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoachingEntities1700000000007 implements MigrationInterface {
  name = 'CreateCoachingEntities1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Budgets table
    await queryRunner.query(`
      CREATE TABLE "budgets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "monthly_income" decimal(12,2) NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_budgets_user_id" ON "budgets"("user_id")`);

    // Budget items table
    await queryRunner.query(`
      CREATE TABLE "budget_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "budget_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "category" varchar(50) DEFAULT 'other',
        "recurring" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_budget_items_budget_id" ON "budget_items"("budget_id")`);

    await queryRunner.query(`
      ALTER TABLE "budget_items"
      ADD CONSTRAINT "fk_budget_items_budget"
      FOREIGN KEY ("budget_id")
      REFERENCES "budgets"("id")
      ON DELETE CASCADE
    `);

    // Goals table
    await queryRunner.query(`
      CREATE TABLE "goals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "target_amount" decimal(12,2) NOT NULL,
        "current_amount" decimal(12,2) DEFAULT 0,
        "type" varchar(30) DEFAULT 'savings',
        "deadline" date,
        "completed" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_goals_user_id" ON "goals"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_goals_completed" ON "goals"("completed")`);

    // Coaching subscriptions table
    await queryRunner.query(`
      CREATE TABLE "coaching_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "stripe_subscription_id" varchar(255),
        "status" varchar(30) DEFAULT 'inactive',
        "started_at" timestamp,
        "canceled_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_coaching_subscriptions_user_id" ON "coaching_subscriptions"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_coaching_subscriptions_status" ON "coaching_subscriptions"("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "coaching_subscriptions"`);
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TABLE "budget_items"`);
    await queryRunner.query(`DROP TABLE "budgets"`);
  }
}
