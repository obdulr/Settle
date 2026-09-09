import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EnrollmentStatus {
  PENDING = 'pending',
  ENROLLED = 'enrolled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  WITHDRAWN = 'withdrawn',
}

export enum ProgramType {
  DEBT_SETTLEMENT = 'debt_settlement',
  DEBT_MANAGEMENT = 'debt_management',
  DEBT_CONSOLIDATION = 'debt_consolidation',
}

@Entity('crm_enrollments')
export class ClientEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: ProgramType,
    name: 'program_type',
    default: ProgramType.DEBT_SETTLEMENT,
  })
  programType: ProgramType;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.PENDING,
  })
  status: EnrollmentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_enrolled_debt' })
  totalEnrolledDebt: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'estimated_settlement_amount' })
  estimatedSettlementAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'monthly_program_payment' })
  monthlyProgramPayment: number;

  @Column({ type: 'int', name: 'program_length_months' })
  programLengthMonths: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'settlement_fee_percent', default: 20 })
  settlementFeePercent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_fees_estimated' })
  totalFeesEstimated: number;

  @Column({ type: 'date', name: 'enrollment_date', nullable: true })
  enrollmentDate?: Date;

  @Column({ type: 'date', name: 'expected_completion_date', nullable: true })
  expectedCompletionDate?: Date;

  @Column({ type: 'date', name: 'actual_completion_date', nullable: true })
  actualCompletionDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_saved_amount', default: 0 })
  totalSavedAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_settled_amount', default: 0 })
  totalSettledAmount: number;

  @Column({ type: 'int', name: 'total_accounts_enrolled', default: 0 })
  totalAccountsEnrolled: number;

  @Column({ type: 'int', name: 'total_accounts_settled', default: 0 })
  totalAccountsSettled: number;

  @Column({ type: 'jsonb', name: 'enrolled_debt_ids', nullable: true })
  enrolledDebtIds?: string[];

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
