import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';

export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') 
    ? { rejectUnauthorized: false }
    : false,
  entities: [User],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});