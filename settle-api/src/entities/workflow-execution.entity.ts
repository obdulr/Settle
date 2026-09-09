import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity('crm_workflow_executions')
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rule_id' })
  @Index()
  ruleId: string;

  @Column({
    type: 'enum',
    enum: WorkflowExecutionStatus,
    default: WorkflowExecutionStatus.PENDING,
  })
  status: WorkflowExecutionStatus;

  @Column({ type: 'jsonb', name: 'trigger_data', nullable: true })
  triggerData?: Record<string, any>;

  @Column({ type: 'jsonb', name: 'action_results', nullable: true })
  actionResults?: {
    actionType: string;
    success: boolean;
    result?: any;
    error?: string;
    executedAt: Date;
  }[];

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

  @Column({ type: 'timestamp', name: 'triggered_at' })
  triggeredAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
