import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CreditorType {
  CREDIT_CARD = 'credit_card',
  COLLECTION_AGENCY = 'collection_agency',
  MEDICAL = 'medical',
  PERSONAL_LOAN = 'personal_loan',
  STUDENT_LOAN = 'student_loan',
  AUTO_LOAN = 'auto_loan',
  PAYDAY_LOAN = 'payday_loan',
  OTHER = 'other',
}

@Entity('crm_creditors')
export class Creditor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CreditorType,
    default: CreditorType.CREDIT_CARD,
  })
  type: CreditorType;

  @Column({ name: 'contact_name', length: 255, nullable: true })
  contactName?: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'contact_email', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ name: 'mailing_address', type: 'text', nullable: true })
  mailingAddress?: string;

  @Column({ name: 'fax_number', length: 20, nullable: true })
  faxNumber?: string;

  @Column({ name: 'website_url', length: 500, nullable: true })
  websiteUrl?: string;

  @Column({ type: 'boolean', name: 'accepts_settlements', default: true })
  acceptsSettlements: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'typical_settlement_percent', nullable: true })
  typicalSettlementPercent?: number;

  @Column({ type: 'int', name: 'typical_settlement_days', nullable: true })
  typicalSettlementDays?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
