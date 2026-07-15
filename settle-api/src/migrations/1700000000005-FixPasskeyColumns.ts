import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPasskeyColumns1700000000005 implements MigrationInterface {
  name = 'FixPasskeyColumns1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename passkey_id column to passkey_credential_id (idempotent)
    const hasPasskeyId = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passkey_id'
    `);
    if (hasPasskeyId && hasPasskeyId.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "users"
        RENAME COLUMN "passkey_id" TO "passkey_credential_id"
      `);
    }

    // 2. Change passkey_public_key from varchar to bytea (idempotent)
    const publicKeyType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passkey_public_key'
    `);
    if (publicKeyType && publicKeyType.length > 0 && publicKeyType[0].data_type !== 'bytea') {
      await queryRunner.query(`
        ALTER TABLE "users"
        ALTER COLUMN "passkey_public_key" TYPE bytea USING "passkey_public_key"::bytea
      `);
    }

    // 3. Add passkey_counter integer column (default 0) (idempotent)
    const hasCounter = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passkey_counter'
    `);
    if (!hasCounter || hasCounter.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "passkey_counter" int DEFAULT 0
      `);
    }

    // 4. Add passkey_transports text column (nullable) (idempotent)
    const hasTransports = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passkey_transports'
    `);
    if (!hasTransports || hasTransports.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD COLUMN "passkey_transports" text
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove passkey_transports column (idempotent)
    const hasTransports = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passkey_transports'
    `);
    if (hasTransports && hasTransports.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "users"
        DROP COLUMN "passkey_transports"
      `);
    }

    // Remove passkey_counter column (idempotent)
    const hasCounter = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passkey_counter'
    `);
    if (hasCounter && hasCounter.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "users"
        DROP COLUMN "passkey_counter"
      `);
    }

    // Revert passkey_public_key from bytea back to varchar (idempotent)
    const publicKeyType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passkey_public_key'
    `);
    if (publicKeyType && publicKeyType.length > 0 && publicKeyType[0].data_type === 'bytea') {
      await queryRunner.query(`
        ALTER TABLE "users"
        ALTER COLUMN "passkey_public_key" TYPE varchar USING "passkey_public_key"::varchar
      `);
    }

    // Rename passkey_credential_id back to passkey_id (idempotent)
    const hasCredentialId = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passkey_credential_id'
    `);
    if (hasCredentialId && hasCredentialId.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "users"
        RENAME COLUMN "passkey_credential_id" TO "passkey_id"
      `);
    }
  }
}
