import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivities1700000000002 implements MigrationInterface {
  name = 'CreateActivities1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "description" text,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_activities_user_id" ON "activities"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_activities_type" ON "activities"("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_activities_created_at" ON "activities"("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "activities"`);
  }
}