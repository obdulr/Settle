import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ConsentType {
  TCPA = 'tcpa',
  DNC_OVERRIDE = 'dnc_override',
  EMAIL = 'email',
  SMS = 'sms',
  CALL_RECORDING = 'call_recording',
  TERMS_OF_SERVICE = 'terms_of_service',
}

export enum ConsentMethod {
  WEB_FORM = 'web_form',
  PHONE = 'phone',
  SMS = 'sms',
  EMAIL = 'email',
  PAPER = 'paper',
  IMPORTED = 'imported',
}

@Entity('crm_consent_logs')
export class ConsentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lead_id', nullable: true })
  @Index()
  leadId?: string;

  @Column({ name: 'client_id', nullable: true })
  @Index()
  clientId?: string;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ name: 'email_address', length: 255, nullable: true })
  emailAddress?: string;

  @Column({
    type: 'enum',
    enum: ConsentType,
    name: 'consent_type',
  })
  consentType: ConsentType;

  @Column({
    type: 'enum',
    enum: ConsentMethod,
    name: 'consent_method',
  })
  consentMethod: ConsentMethod;

  @Column({ type: 'boolean' })
  granted: boolean;

  @Column({ type: 'text', name: 'consent_language', nullable: true })
  consentLanguage?: string;

  @Column({ name: 'ip_address', length: 64, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', length: 512, nullable: true })
  userAgent?: string;

  @Column({ name: 'page_version', length: 64, nullable: true })
  pageVersion?: string;

  @Column({ type: 'timestamp', name: 'consent_timestamp' })
  consentTimestamp: Date;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
