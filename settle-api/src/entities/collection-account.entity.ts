import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CollectionAccountStatus {
  NEW = 'new',
  ACTIVE = 'active',
  CONTACTED = 'contacted',
  PAYMENT_PLAN = 'payment_plan',
  SETTLED = 'settled',
  PAID_IN_FULL = 'paid_in_full',
  LITIGATION = 'litigation',
  CHARGE_OFF = 'charge_off',
  BANKRUPTCY = 'bankruptcy',
  DECEASED = 'deceased',
  CLOSED = 'closed',
}

export enum CollectionAccountPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

@Entity('collection_accounts')
export class CollectionAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_number', length: 255, nullable: true })
  accountNumber?: string;

  @Column({ name: 'crm_client_id' })
  @Index()
  crmClientId: string;

  @Column({ name: 'creditor_id', nullable: true })
  @Index()
  creditorId?: string;

  @Column({ name: 'debt_buyer_id', nullable: true })
  @Index()
  debtBuyerId?: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'original_balance',
    default: 0,
  })
  originalBalance: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'current_balance',
    default: 0,
  })
  currentBalance: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'interest_rate',
    nullable: true,
  })
  interestRate?: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'monthly_payment',
    nullable: true,
  })
  monthlyPayment?: number;

  @Column({
    type: 'enum',
    enum: CollectionAccountStatus,
    default: CollectionAccountStatus.NEW,
  })
  status: CollectionAccountStatus;

  @Column({ type: 'int', default: CollectionAccountPriority.MEDIUM })
  priority: number;

  @Column({ type: 'int', name: 'delinquency_days', default: 0 })
  delinquencyDays: number;

  @Column({ type: 'date', name: 'last_payment_date', nullable: true })
  lastPaymentDate?: string;

  @Column({ type: 'date', name: 'statute_of_limitations_date', nullable: true })
  statuteOfLimitationsDate?: string;

  @Column({ type: 'date', name: 'charged_off_date', nullable: true })
  chargedOffDate?: string;

  @Column({ name: 'assigned_to', nullable: true })
  @Index()
  assignedTo?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column('jsonb', { name: 'custom_fields', nullable: true })
  customFields?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
