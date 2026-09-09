import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AssignmentStatus {
  ASSIGNED = 'assigned',
  CLAIMED = 'claimed',
  RELEASED = 'released',
  REASSIGNED = 'reassigned',
  EXPIRED = 'expired',
}

@Entity('crm_lead_assignments')
export class LeadAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lead_id' })
  @Index()
  leadId: string;

  @Column({ name: 'assigned_to' })
  @Index()
  assignedTo: string;

  @Column({ name: 'routing_rule_id', nullable: true })
  routingRuleId?: string;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ASSIGNED,
  })
  status: AssignmentStatus;

  @Column({ type: 'timestamp', name: 'assigned_at' })
  assignedAt: Date;

  @Column({ type: 'timestamp', name: 'claimed_at', nullable: true })
  claimedAt?: Date;

  @Column({ type: 'timestamp', name: 'released_at', nullable: true })
  releasedAt?: Date;

  @Column({ type: 'timestamp', name: 'first_contact_at', nullable: true })
  firstContactAt?: Date;

  @Column({ type: 'int', name: 'seconds_to_contact', nullable: true })
  secondsToContact?: number;

  @Column({ type: 'boolean', name: 'is_shark_tank', default: false })
  isSharkTank: boolean;

  @Column({ type: 'timestamp', name: 'shark_tank_expires_at', nullable: true })
  sharkTankExpiresAt?: Date;

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
