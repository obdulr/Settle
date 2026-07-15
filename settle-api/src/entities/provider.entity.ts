import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  companyName!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Services offered
  @Column({ type: 'simple-array', nullable: true })
  serviceTypes?: string[]; // debt_settlement, debt_consolidation, credit_repair, bankruptcy

  @Column({ type: 'simple-array', nullable: true })
  debtTypes?: string[]; // credit_card, medical, personal_loan, student_loan

  @Column({ type: 'simple-array', nullable: true })
  statesServed?: string[];

  // Qualification thresholds
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 7500 })
  minDebtAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDebtAmount?: number;

  // Pricing
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  feePercentage?: number; // % of enrolled debt

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  leadPrice?: number; // Price they pay per lead

  // Reputation
  @Column({ type: 'varchar', length: 10, nullable: true })
  bbbRating?: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  avgRating?: number;

  @Column({ type: 'int', default: 0 })
  reviewCount!: number;

  @Column({ type: 'int', default: 0 })
  successfulSettlements!: number;

  @Column({ type: 'int', nullable: true })
  avgSettlementDays?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgSavingsPercentage?: number; // How much they save clients on average

  // Membership & certification
  @Column({ type: 'boolean', default: false })
  isAfccMember!: boolean;

  @Column({ type: 'boolean', default: false })
  isIapdaMember!: boolean;

  @Column({ type: 'int', nullable: true })
  yearsInBusiness?: number;

  // Marketplace settings
  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string; // pending, active, suspended, inactive

  @Column({ type: 'varchar', length: 50, default: 'pay_per_lead' })
  subscriptionType!: string; // pay_per_lead, marketplace_seat

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditBalance!: number;

  @Column({ type: 'boolean', default: true })
  isAcceptingLeads!: boolean;

  // Stripe billing
  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId?: string;

  // Subscription billing (marketplace seat plans)
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'stripe_subscription_id' })
  stripeSubscriptionId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'subscription_status' })
  subscriptionStatus?: string; // active, past_due, canceled, trialing, etc.

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'subscription_tier' })
  subscriptionTier?: string; // starter, growth, scale

  @Column({ type: 'int', nullable: true, name: 'subscription_seats' })
  subscriptionSeats?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'current_period_end' })
  currentPeriodEnd?: Date;

  @Column({ type: 'boolean', default: false, name: 'cancel_at_period_end' })
  cancelAtPeriodEnd!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}