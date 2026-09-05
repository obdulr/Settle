import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CommunicationType {
  CALL = 'call',
  SMS = 'sms',
  EMAIL = 'email',
  WEB_CHAT = 'web_chat',
  AI_CALL = 'ai_call',
  AI_TEXT = 'ai_text',
}

export enum CommunicationDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum CommunicationStatus {
  CONNECTED = 'connected',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  FAILED = 'failed',
  VOICEMAIL = 'voicemail',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  REPLIED = 'replied',
  BOUNCED = 'bounced',
}

@Entity('crm_communication_logs')
export class CommunicationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lead_id', nullable: true })
  @Index()
  leadId?: string;

  @Column({ name: 'client_id', nullable: true })
  @Index()
  clientId?: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({
    type: 'enum',
    enum: CommunicationType,
    name: 'communication_type',
  })
  communicationType: CommunicationType;

  @Column({
    type: 'enum',
    enum: CommunicationDirection,
  })
  direction: CommunicationDirection;

  @Column({
    type: 'enum',
    enum: CommunicationStatus,
    default: CommunicationStatus.SENT,
  })
  status: CommunicationStatus;

  @Column({ name: 'from_number', length: 20, nullable: true })
  fromNumber?: string;

  @Column({ name: 'to_number', length: 20, nullable: true })
  toNumber?: string;

  @Column({ name: 'from_email', length: 255, nullable: true })
  fromEmail?: string;

  @Column({ name: 'to_email', length: 255, nullable: true })
  toEmail?: string;

  @Column({ type: 'text', nullable: true })
  subject?: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'int', name: 'duration_seconds', nullable: true })
  durationSeconds?: number;

  @Column({ type: 'boolean', name: 'was_recorded', default: false })
  wasRecorded: boolean;

  @Column({ name: 'recording_url', length: 500, nullable: true })
  recordingUrl?: string;

  @Column({ name: 'transcript_url', length: 500, nullable: true })
  transcriptUrl?: string;

  @Column({ type: 'jsonb', name: 'ai_insights', nullable: true })
  aiInsights?: {
    sentiment?: string;
    sentimentScore?: number;
    callScore?: number;
    summary?: string;
    keyMoments?: string[];
    complianceFlags?: string[];
    coachingNotes?: string[];
  };

  @Column({ type: 'timestamp', name: 'connected_at', nullable: true })
  connectedAt?: Date;

  @Column({ type: 'timestamp', name: 'ended_at', nullable: true })
  endedAt?: Date;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
