import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum CallStatus {
  SCHEDULED = 'scheduled',
  DIALING = 'dialing',
  RINGING = 'ringing',
  ANSWERED = 'answered',
  COMPLETED = 'completed',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  FAILED = 'failed',
  VOICEMAIL = 'voicemail',
  CANCELLED = 'cancelled',
}

@Entity('call_logs')
export class CallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'collection_account_id' })
  @Index()
  collectionAccountId: string;

  @Column({ name: 'agent_id', nullable: true })
  @Index()
  agentId?: string;

  @Column({ name: 'phone_number', length: 30 })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: CallDirection,
    default: CallDirection.OUTBOUND,
  })
  direction: CallDirection;

  @Column({
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.SCHEDULED,
  })
  status: CallStatus;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt?: Date;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ name: 'recording_url', type: 'text', nullable: true })
  recordingUrl?: string;

  @Column({ type: 'text', nullable: true })
  transcript?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ length: 100, default: 'telnyx' })
  provider: string;

  @Column({ name: 'provider_call_id', length: 255, nullable: true })
  providerCallId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cost: number;

  @Column('jsonb', { name: 'raw_response', nullable: true })
  rawResponse?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
