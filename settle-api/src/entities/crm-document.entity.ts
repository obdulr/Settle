import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DocumentType {
  ENROLLMENT_AGREEMENT = 'enrollment_agreement',
  DISCLOSURE = 'disclosure',
  SETTLEMENT_LETTER = 'settlement_letter',
  CREDITOR_LETTER = 'creditor_letter',
  HARDSHIP_LETTER = 'hardship_letter',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  BANK_STATEMENT = 'bank_statement',
  IDENTITY_VERIFICATION = 'identity_verification',
  PROGRAM_SUMMARY = 'program_summary',
  COMPLETION_CERTIFICATE = 'completion_certificate',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  SIGNED = 'signed',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
}

@Entity('crm_documents')
export class CrmDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    name: 'document_type',
  })
  documentType: DocumentType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'file_url', length: 500 })
  fileUrl: string;

  @Column({ name: 'file_name', length: 255, nullable: true })
  fileName?: string;

  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize?: number;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType?: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'enrollment_id', nullable: true })
  @Index()
  enrollmentId?: string;

  @Column({ name: 'settlement_id', nullable: true })
  @Index()
  settlementId?: string;

  @Column({ name: 'creditor_id', nullable: true })
  creditorId?: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'timestamp', name: 'sent_at', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', name: 'viewed_at', nullable: true })
  viewedAt?: Date;

  @Column({ type: 'timestamp', name: 'signed_at', nullable: true })
  signedAt?: Date;

  @Column({ name: 'signature_ip', length: 64, nullable: true })
  signatureIp?: string;

  @Column({ name: 'signature_user_agent', length: 512, nullable: true })
  signatureUserAgent?: string;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
