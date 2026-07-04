import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsers1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'customer'",
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
            isNullable: true,
          },
          {
            name: 'email_verification_token',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email_verification_expires',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'phone_verified',
            type: 'boolean',
            default: false,
            isNullable: true,
          },
          {
            name: 'passkey_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'passkey_public_key',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'passkey_verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failed_login_attempts',
            type: 'int',
            default: 0,
            isNullable: true,
          },
          {
            name: 'last_failed_login_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lockout_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'account_locked',
            type: 'boolean',
            default: false,
            isNullable: true,
          },
          {
            name: 'last_password_change_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reset_token',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'reset_token_expires',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}