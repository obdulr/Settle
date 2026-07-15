import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Budget } from './budget.entity';

@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'budget_id' })
  budgetId!: string;

  @ManyToOne(() => Budget, (budget) => budget.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'budget_id' })
  budget!: Budget;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 50, default: 'other' })
  category!: string; // housing, food, transport, utilities, insurance, entertainment, other

  @Column({ type: 'boolean', default: false })
  recurring!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
