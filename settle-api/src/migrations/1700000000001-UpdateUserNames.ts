import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserNames1700000000001 implements MigrationInterface {
  name = 'UpdateUserNames1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add firstName and lastName columns
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "firstName" varchar(255),
      ADD COLUMN "lastName" varchar(255)
    `);

    // Migrate existing name data to firstName if exists
    await queryRunner.query(`
      UPDATE "users" 
      SET "firstName" = "name" 
      WHERE "name" IS NOT NULL
    `);

    // Remove old name column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "name"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back name column
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "name" varchar(255)
    `);

    // Migrate firstName back to name
    await queryRunner.query(`
      UPDATE "users" 
      SET "name" = "firstName" 
      WHERE "firstName" IS NOT NULL
    `);

    // Remove firstName and lastName columns
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "firstName",
      DROP COLUMN "lastName"
    `);
  }
}