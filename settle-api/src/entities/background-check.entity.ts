import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BackgroundCheckStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  MANUAL = 'manual',
}

export enum BackgroundCheckProvider {
  CHECKR = 'checkr',
  FIRST_ADVANTAGE = 'first_advantage',
  STERLING = 'sterling',
  MANUAL = 'manual',
}

@Entity('background_checks')
export class BackgroundCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'collection_account_id' })
  @Index()
  collectionAccountId: string;

  @Column({
    type: 'enum',
    enum: BackgroundCheckProvider,
    default: BackgroundCheckProvider.MANUAL,
  })
  provider: BackgroundCheckProvider;

  @Column({
    type: 'enum',
    enum: BackgroundCheckStatus,
    default: BackgroundCheckStatus.MANUAL,
  })
  status: BackgroundCheckStatus;

  @Column('jsonb', { name: 'request_payload', nullable: true })
  requestPayload?: Record<string, any>;

  @Column('jsonb', { name: 'criminal_records', nullable: true })
  criminalRecords?: {
    source?: string;
    offense?: string;
    disposition?: string;
    sentencingDate?: string;
    jurisdiction?: string;
  }[];

  @Column('jsonb', { name: 'civil_records', nullable: true })
  civilRecords?: {
    type?: string;
    court?: string;
    filingDate?: string;
    disposition?: string;
    amount?: number;
  }[];

  @Column('jsonb', { name: 'employment_verification', nullable: true })
  employmentVerification?: {
    employerName?: string;
    verified?: boolean;
    position?: string;
    startDate?: string;
    endDate?: string;
  }[];

  @Column('jsonb', { name: 'education_verification', nullable: true })
  educationVerification?: {
    institution?: string;
    degree?: string;
    verified?: boolean;
    completionDate?: string;
  }[];

  @Column('jsonb', { name: 'address_history', nullable: true })
  addressHistory?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    from?: string;
    to?: string;
  }[];

  @Column({ name: 'sex_offender_status', type: 'varchar', length: 50, nullable: true })
  sexOffenderStatus?: string;

  @Column('jsonb', { name: 'global_watchlist', nullable: true })
  globalWatchlist?: {
    source?: string;
    matchType?: string;
    name?: string;
    details?: string;
  }[];

  @Column({ name: 'adverse_action_required', type: 'boolean', default: false })
  adverseActionRequired: boolean;

  @Column('jsonb', { name: 'raw_response', nullable: true })
  rawResponse?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
