import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MilestoneType {
  ENROLLMENT = 'enrollment',
  FIRST_PAYMENT = 'first_payment',
  FIRST_SETTLEMENT = 'first_settlement',
  QUARTER_SETTLED = 'quarter_settled',
  HALF_SETTLED = 'half_settled',
  THREE_QUARTER_SETTLED = 'three_quarter_settled',
  ALL_SETTLED = 'all_settled',
  PROGRAM_COMPLETION = 'program_completion',
  CUSTOM = 'custom',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  REACHED = 'reached',
  SKIPPED = 'skipped',
}

@Entity('crm_milestones')
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enrollment_id' })
  @Index()
  enrollmentId: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({
    type: 'enum',
    enum: MilestoneType,
    name: 'milestone_type',
  })
  milestoneType: MilestoneType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status: MilestoneStatus;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'progress_threshold', nullable: true })
  progressThreshold?: number; // percentage of accounts settled to trigger

  @Column({ type: 'timestamp', name: 'target_date', nullable: true })
  targetDate?: Date;

  @Column({ type: 'timestamp', name: 'reached_date', nullable: true })
  reachedDate?: Date;

  @Column({ type: 'jsonb', name: 'trigger_actions', nullable: true })
  triggerActions?: {
    type: string; // send_email, send_text, create_task, notify_agent, update_client_portal
    config?: Record<string, any>;
  }[];

  @Column({ type: 'boolean', name: 'client_visible', default: true })
  clientVisible: boolean;

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
