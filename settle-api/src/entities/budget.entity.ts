import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BudgetItem } from './budget-item.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'monthly_income' })
  monthlyIncome!: number;

  @OneToMany(() => BudgetItem, (item) => item.budget, {
    cascade: true,
    eager: true,
  })
  expenses!: BudgetItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
