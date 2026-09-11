import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesFollowUpColumns1700000000025 implements MigrationInterface {
  name = 'AddSalesFollowUpColumns1700000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('leads');
    if (!tableExists) return;

    const hasFollowUp = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'follow_up_date'`,
    );
    if (!hasFollowUp?.length) {
      await queryRunner.query(`ALTER TABLE "leads" ADD COLUMN "follow_up_date" TIMESTAMP NULL`);
    }

    const hasLastContacted = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_contacted_at'`,
    );
    if (!hasLastContacted?.length) {
      await queryRunner.query(`ALTER TABLE "leads" ADD COLUMN "last_contacted_at" TIMESTAMP NULL`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN IF EXISTS "follow_up_date"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN IF EXISTS "last_contacted_at"`);
  }
}
