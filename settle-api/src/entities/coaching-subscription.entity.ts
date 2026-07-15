import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('coaching_subscriptions')
export class CoachingSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 255, name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: 'varchar', length: 30, default: 'inactive' })
  status!: string; // active, canceled, past_due, inactive

  @Column({ type: 'timestamp', name: 'started_at', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', name: 'canceled_at', nullable: true })
  canceledAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
