import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CrmDealStage {
  AWARENESS = 'awareness',
  INTEREST = 'interest',
  CONSIDERATION = 'consideration',
  INTENT = 'intent',
  PURCHASE = 'purchase',
}

export enum CrmDealStatus {
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  ON_HOLD = 'on_hold',
}

@Entity('crm_deals')
export class CrmDeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'contact_id', nullable: true })
  contactId?: string;

  @Column({
    type: 'enum',
    enum: CrmDealStage,
  })
  stage: CrmDealStage;

  @Column('decimal', { precision: 12, scale: 2 })
  value: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column('int', { default: 0 })
  probability: number;

  @Column({ type: 'timestamp', name: 'expected_close_date', nullable: true })
  expectedCloseDate?: Date;

  @Column({
    type: 'enum',
    enum: CrmDealStatus,
    default: CrmDealStatus.ACTIVE,
  })
  status: CrmDealStatus;

  @Column({ type: 'timestamp', name: 'won_date', nullable: true })
  wonDate?: Date;

  @Column({ type: 'timestamp', name: 'lost_date', nullable: true })
  lostDate?: Date;

  @Column({ name: 'lost_reason', nullable: true })
  lostReason?: string;

  @Column({ name: 'assigned_to' })
  assignedTo: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column('jsonb', { nullable: true })
  customFields?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  activities?: {
    date: Date;
    type: string;
    description: string;
    outcome?: string;
  }[];

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
