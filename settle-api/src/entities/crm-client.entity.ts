import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CrmClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect',
  LEAD = 'lead',
}

export enum CrmLifecycleStage {
  AWARENESS = 'awareness',
  CONSIDERATION = 'consideration',
  DECISION = 'decision',
  RETENTION = 'retention',
  ADVOCACY = 'advocacy',
}

@Entity('crm_clients')
export class CrmClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle?: string;

  @Column({
    type: 'enum',
    enum: CrmClientStatus,
    default: CrmClientStatus.ACTIVE,
  })
  status: CrmClientStatus;

  @Column({
    type: 'enum',
    enum: CrmLifecycleStage,
    name: 'lifecycle_stage',
    default: CrmLifecycleStage.AWARENESS,
  })
  lifecycleStage: CrmLifecycleStage;

  @Column()
  source: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column('decimal', { precision: 12, scale: 2, name: 'total_value', default: 0 })
  totalValue: number;

  @Column({ type: 'timestamp', name: 'last_contact', nullable: true })
  lastContact?: Date;

  @Column({ type: 'timestamp', name: 'next_follow_up', nullable: true })
  nextFollowUp?: Date;

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo?: string;

  @Column('jsonb', { nullable: true })
  preferences?: {
    communicationMethod?: string;
    preferredTime?: string;
    interests?: string[];
  };

  @Column('jsonb', { nullable: true })
  customFields?: Record<string, any>;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
