import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Activity } from './entities/activity.entity';
import { Debt } from './entities/debt.entity';
import { Provider } from './entities/provider.entity';
import { Lead } from './entities/lead.entity';
import { Match } from './entities/match.entity';
import { Budget } from './entities/budget.entity';
import { BudgetItem } from './entities/budget-item.entity';
import { Goal } from './entities/goal.entity';
import { CoachingSubscription } from './entities/coaching-subscription.entity';

export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
  entities: [User, Activity, Debt, Provider, Lead, Match, Budget, BudgetItem, Goal, CoachingSubscription],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});