import { dataSource } from '../data-source';
import { CreateUsers1700000000000 } from './1700000000000-CreateUsers';

async function runMigration() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    const migration = new CreateUsers1700000000000();
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await migration.up(queryRunner);
      await queryRunner.commitTransaction();
      console.log('Migration completed successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();