import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPasskeyColumns1700000000005 implements MigrationInterface {
  name = 'FixPasskeyColumns1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename passkey_id column to passkey_credential_id
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "passkey_id" TO "passkey_credential_id"
    `);

    // 2. Change passkey_public_key from varchar to bytea
    //    Cast existing text data to bytea (NULL-safe); any existing
    //    passkey rows are re-registered after the migration.
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "passkey_public_key" TYPE bytea USING "passkey_public_key"::bytea
    `);

    // 3. Add passkey_counter integer column (default 0)
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "passkey_counter" int DEFAULT 0
    `);

    // 4. Add passkey_transports text column (nullable)
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "passkey_transports" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove passkey_transports column
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "passkey_transports"
    `);

    // Remove passkey_counter column
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "passkey_counter"
    `);

    // Revert passkey_public_key from bytea back to varchar
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "passkey_public_key" TYPE varchar USING "passkey_public_key"::varchar
    `);

    // Rename passkey_credential_id back to passkey_id
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "passkey_credential_id" TO "passkey_id"
    `);
  }
}
