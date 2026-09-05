import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SettlementPaymentType {
  SETTLEMENT_PAYMENT = 'settlement_payment',
  FEE_PAYMENT = 'fee_payment',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
}

export enum SettlementPaymentStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PROCESSED = 'processed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('crm_settlement_payments')
export class SettlementPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trust_account_id' })
  @Index()
  trustAccountId: string;

  @Column({ name: 'settlement_id', nullable: true })
  @Index()
  settlementId?: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'creditor_id', nullable: true })
  creditorId?: string;

  @Column({
    type: 'enum',
    enum: SettlementPaymentType,
    name: 'payment_type',
  })
  paymentType: SettlementPaymentType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date', name: 'scheduled_date', nullable: true })
  scheduledDate?: Date;

  @Column({ type: 'date', name: 'processed_date', nullable: true })
  processedDate?: Date;

  @Column({
    type: 'enum',
    enum: SettlementPaymentStatus,
    default: SettlementPaymentStatus.PENDING,
  })
  status: SettlementPaymentStatus;

  @Column({ name: 'payment_method', length: 50, nullable: true })
  paymentMethod?: string; // ach, wire, check, manual

  @Column({ name: 'reference_number', length: 255, nullable: true })
  referenceNumber?: string;

  @Column({ name: 'external_transaction_id', length: 255, nullable: true })
  externalTransactionId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
