import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDeposits1700000000010 implements MigrationInterface {
  name = 'CreateDeposits1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('deposits');
    if (hasTable) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'deposits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'providerId', type: 'uuid', isNullable: true },
          { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
          { name: 'currency', type: 'varchar', length: '3', default: "'USD'" },
          { name: 'method', type: 'varchar', length: '20' },
          { name: 'reference', type: 'varchar', length: '255', isNullable: true },
          { name: 'externalTransactionId', type: 'varchar', length: '255', isNullable: true },
          { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'approvedBy', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('deposits');
  }
}
