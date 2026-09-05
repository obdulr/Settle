import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskType {
  CALLBACK = 'callback',
  FOLLOW_UP = 'follow_up',
  DOCUMENT_REQUEST = 'document_request',
  SETTLEMENT_NEGOTIATION = 'settlement_negotiation',
  COMPLIANCE_REVIEW = 'compliance_review',
  ENROLLMENT_FOLLOWUP = 'enrollment_followup',
  PAYMENT_REMINDER = 'payment_reminder',
  GENERAL = 'general',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

@Entity('crm_tasks')
export class CrmTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.GENERAL,
  })
  type: TaskType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({ name: 'lead_id', nullable: true })
  @Index()
  leadId?: string;

  @Column({ name: 'client_id', nullable: true })
  @Index()
  clientId?: string;

  @Column({ name: 'enrollment_id', nullable: true })
  @Index()
  enrollmentId?: string;

  @Column({ name: 'settlement_id', nullable: true })
  @Index()
  settlementId?: string;

  @Column({ name: 'assigned_to' })
  @Index()
  assignedTo: string;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy?: string;

  @Column({ type: 'timestamp', name: 'due_date' })
  @Index()
  dueDate: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', name: 'reminder_sent_at', nullable: true })
  reminderSentAt?: Date;

  @Column({ type: 'boolean', name: 'auto_reminder', default: true })
  autoReminder: boolean;

  @Column({ type: 'int', name: 'reminder_minutes_before', default: 15 })
  reminderMinutesBefore: number;

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
