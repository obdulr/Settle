import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'target_amount' })
  targetAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'current_amount', default: 0 })
  currentAmount!: number;

  @Column({ type: 'varchar', length: 30, default: 'savings' })
  type!: string; // debt_payoff, savings, emergency_fund

  @Column({ type: 'date', nullable: true })
  deadline?: Date;

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
