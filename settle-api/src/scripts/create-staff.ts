import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

type StaffDefinition = {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

const staff: StaffDefinition[] = [
  {
    email: process.env.ADMIN_EMAIL || 'admin@settleinpeace.com',
    password: process.env.ADMIN_PASSWORD || 'AdminPass123!',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+10000000001',
  },
  {
    email: process.env.SALES_EMAIL || 'sales@settleinpeace.com',
    password: process.env.SALES_PASSWORD || 'SalesPass123!',
    role: 'sales',
    firstName: 'Sales',
    lastName: 'Agent',
    phone: '+10000000002',
  },
];

async function main() {
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

    for (const member of staff) {
      const existingUser = await usersRepository.findOne({ where: { email: member.email } });
      const hashedPassword = await bcrypt.hash(member.password, 10);

      if (existingUser) {
        await usersRepository.update(existingUser.id, {
          role: member.role,
          emailVerified: true,
          password: hashedPassword,
          firstName: member.firstName,
          lastName: member.lastName,
          phone: member.phone,
        });
        console.log(`Updated existing user ${member.email} as ${member.role}.`);
      } else {
        const user = usersRepository.create({
          email: member.email,
          password: hashedPassword,
          role: member.role,
          emailVerified: true,
          firstName: member.firstName,
          lastName: member.lastName,
          phone: member.phone,
        });
        await usersRepository.save(user);
        console.log(`Created ${member.role} user ${member.email}.`);
      }
    }

    console.log('\n=== Staff credentials ===');
    for (const member of staff) {
      console.log(`Role:    ${member.role}`);
      console.log(`Email:   ${member.email}`);
      console.log(`Password: ${member.password}`);
      console.log('---');
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Failed to create staff users:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

main();
