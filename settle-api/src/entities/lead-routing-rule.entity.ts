import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RoutingStrategy {
  ROUND_ROBIN = 'round_robin',
  WEIGHTED = 'weighted',
  BEST_AGENT = 'best_agent',
  SHARK_TANK = 'shark_tank',
}

@Entity('crm_routing_rules')
export class LeadRoutingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'int', name: 'priority', default: 0 })
  priority: number;

  @Column({
    type: 'enum',
    enum: RoutingStrategy,
    name: 'routing_strategy',
    default: RoutingStrategy.ROUND_ROBIN,
  })
  routingStrategy: RoutingStrategy;

  // Conditions (all must match for the rule to apply)
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'min_debt_amount', nullable: true })
  minDebtAmount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'max_debt_amount', nullable: true })
  maxDebtAmount?: number;

  @Column({ type: 'text', array: true, name: 'states', default: [] })
  states: string[];

  @Column({ type: 'text', array: true, name: 'debt_types', default: [] })
  debtTypes: string[];

  @Column({ type: 'text', array: true, name: 'creditor_types', default: [] })
  creditorTypes: string[];

  // Agent assignment pool
  @Column({ type: 'text', array: true, name: 'agent_user_ids', default: [] })
  agentUserIds: string[];

  // Speed-to-lead automation
  @Column({ type: 'boolean', name: 'speed_to_lead_enabled', default: false })
  speedToLeadEnabled: boolean;

  @Column({ type: 'int', name: 'speed_to_lead_seconds', default: 60 })
  speedToLeadSeconds: number;

  @Column({ type: 'boolean', name: 'auto_call', default: false })
  autoCall: boolean;

  @Column({ type: 'boolean', name: 'auto_text', default: false })
  autoText: boolean;

  @Column({ type: 'boolean', name: 'auto_email', default: false })
  autoEmail: boolean;

  // Redistribution settings
  @Column({ type: 'boolean', name: 'redistribution_enabled', default: false })
  redistributionEnabled: boolean;

  @Column({ type: 'int', name: 'redistribution_hours', default: 24 })
  redistributionHours: number;

  // Shark tank settings
  @Column({ type: 'boolean', name: 'shark_tank_enabled', default: false })
  sharkTankEnabled: boolean;

  @Column({ type: 'int', name: 'shark_tank_claim_minutes', default: 30 })
  sharkTankClaimMinutes: number;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
