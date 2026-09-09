import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WorkflowTrigger {
  LEAD_CREATED = 'lead_created',
  LEAD_ASSIGNED = 'lead_assigned',
  LEAD_CONTACTED = 'lead_contacted',
  LEAD_QUALIFIED = 'lead_qualified',
  ENROLLMENT_CREATED = 'enrollment_created',
  ENROLLMENT_ACTIVATED = 'enrollment_activated',
  SETTLEMENT_CREATED = 'settlement_created',
  SETTLEMENT_OFFER_MADE = 'settlement_offer_made',
  SETTLEMENT_ACCEPTED = 'settlement_accepted',
  SETTLEMENT_APPROVED = 'settlement_approved',
  SETTLEMENT_FUNDED = 'settlement_funded',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_MISSED = 'payment_missed',
  OFFER_EXPIRING = 'offer_expiring',
  MILESTONE_REACHED = 'milestone_reached',
  DOCUMENT_SIGNED = 'document_signed',
  CLIENT_DROPOUT_RISK = 'client_dropout_risk',
}

export enum WorkflowActionType {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  CREATE_TASK = 'create_task',
  NOTIFY_AGENT = 'notify_agent',
  NOTIFY_CLIENT = 'notify_client',
  UPDATE_LEAD_STATUS = 'update_lead_status',
  CREATE_DOCUMENT = 'create_document',
  TRIGGER_WEBHOOK = 'trigger_webhook',
}

@Entity('crm_workflow_rules')
export class WorkflowRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: WorkflowTrigger,
    name: 'trigger_event',
  })
  triggerEvent: WorkflowTrigger;

  @Column({ type: 'jsonb', name: 'trigger_conditions', nullable: true })
  triggerConditions?: Record<string, any>; // e.g., { minDebtAmount: 10000, states: ['CA', 'TX'] }

  @Column({ type: 'jsonb', name: 'actions' })
  actions: {
    type: WorkflowActionType;
    config: Record<string, any>;
    delayMinutes?: number;
  }[];

  @Column({ type: 'int', name: 'execution_count', default: 0 })
  executionCount: number;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
