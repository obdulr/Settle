import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

const email = process.argv[2] || process.env.ADMIN_EMAIL;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;

async function main() {
  if (!email || !password) {
    console.error('Usage: ts-node src/scripts/create-admin.ts <email> <password>');
    console.error('Or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway')
      ? { rejectUnauthorized: false }
      : false,
    entities: [User],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  });

  try {
    await dataSource.initialize();
    const usersRepository = dataSource.getRepository(User);

    const existingUser = await usersRepository.findOne({ where: { email } });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      await usersRepository.update(existingUser.id, {
        role: 'admin',
        emailVerified: true,
        password: hashedPassword,
      });
      console.log(`Updated existing user ${email} as admin.`);
    } else {
      const user = usersRepository.create({
        email,
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
        firstName: 'Admin',
        lastName: 'User',
      });
      await usersRepository.save(user);
      console.log(`Created admin user ${email}.`);
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

main();
