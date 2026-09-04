import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDeletedAt1700000000014 implements MigrationInterface {
  name = 'AddUserDeletedAt1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "deleted_at" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "deleted_at"
    `);
  }
}
