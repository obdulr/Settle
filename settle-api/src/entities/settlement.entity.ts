import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SettlementStatus {
  PENDING = 'pending',
  NEGOTIATING = 'negotiating',
  OFFER_MADE = 'offer_made',
  COUNTER_OFFER = 'counter_offer',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  APPROVED = 'approved',
  FUNDED = 'funded',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('crm_settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enrollment_id' })
  @Index()
  enrollmentId: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'creditor_id' })
  @Index()
  creditorId: string;

  @Column({ name: 'debt_id', nullable: true })
  debtId?: string;

  @Column({ name: 'account_number', length: 100, nullable: true })
  accountNumber?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'original_balance' })
  originalBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'current_balance' })
  currentBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'offered_amount' })
  offeredAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'settlement_amount', nullable: true })
  settlementAmount?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'settlement_percent', nullable: true })
  settlementPercent?: number;

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @Column({ type: 'jsonb', name: 'negotiation_history', nullable: true })
  negotiationHistory?: {
    date: Date;
    action: string;
    amount?: number;
    by: string;
    notes?: string;
  }[];

  @Column({ type: 'date', name: 'offer_date', nullable: true })
  offerDate?: Date;

  @Column({ type: 'date', name: 'acceptance_date', nullable: true })
  acceptanceDate?: Date;

  @Column({ type: 'date', name: 'funded_date', nullable: true })
  fundedDate?: Date;

  @Column({ type: 'date', name: 'completion_date', nullable: true })
  completionDate?: Date;

  @Column({ type: 'int', name: 'days_to_settle', nullable: true })
  daysToSettle?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'client_fee', nullable: true })
  clientFee?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'savings_amount', nullable: true })
  savingsAmount?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'savings_percent', nullable: true })
  savingsPercent?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo?: string;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
