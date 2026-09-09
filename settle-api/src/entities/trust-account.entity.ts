import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TrustAccountStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  CLOSED = 'closed',
  PENDING = 'pending',
}

@Entity('crm_trust_accounts')
export class TrustAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'enrollment_id' })
  @Index()
  enrollmentId: string;

  @Column({ name: 'account_number', length: 50, nullable: true })
  accountNumber?: string;

  @Column({ name: 'routing_number', length: 50, nullable: true })
  routingNumber?: string;

  @Column({ name: 'bank_name', length: 255, nullable: true })
  bankName?: string;

  @Column({
    type: 'enum',
    enum: TrustAccountStatus,
    default: TrustAccountStatus.PENDING,
  })
  status: TrustAccountStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'current_balance', default: 0 })
  currentBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_deposited', default: 0 })
  totalDeposited: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_withdrawn', default: 0 })
  totalWithdrawn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_fees_collected', default: 0 })
  totalFeesCollected: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_settlements_paid', default: 0 })
  totalSettlementsPaid: number;

  @Column({ type: 'date', name: 'opened_date', nullable: true })
  openedDate?: Date;

  @Column({ type: 'date', name: 'closed_date', nullable: true })
  closedDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
