import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BankruptcyStatus {
  NONE = 'none',
  PENDING = 'pending',
  DISCHARGED = 'discharged',
  DISMISSED = 'dismissed',
  CHAPTER_7 = 'chapter_7',
  CHAPTER_11 = 'chapter_11',
  CHAPTER_13 = 'chapter_13',
}

@Entity('debtor_profiles')
export class DebtorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'crm_client_id', unique: true })
  @Index()
  crmClientId: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ name: 'ssn_last4', length: 4, nullable: true })
  ssnLast4?: string;

  @Column('text', { name: 'aliases', array: true, default: [] })
  aliases: string[];

  @Column({ name: 'employer_name', length: 255, nullable: true })
  employerName?: string;

  @Column({ name: 'employer_phone', length: 30, nullable: true })
  employerPhone?: string;

  @Column({ name: 'occupation', length: 255, nullable: true })
  occupation?: string;

  @Column({ name: 'spouse_name', length: 255, nullable: true })
  spouseName?: string;

  @Column('jsonb', { name: 'address_history', nullable: true })
  addressHistory?: {
    address: string;
    city?: string;
    state?: string;
    zip?: string;
    from?: string;
    to?: string;
  }[];

  @Column({
    type: 'enum',
    enum: BankruptcyStatus,
    name: 'bankruptcy_status',
    default: BankruptcyStatus.NONE,
  })
  bankruptcyStatus: BankruptcyStatus;

  @Column({ type: 'date', name: 'deceased_date', nullable: true })
  deceasedDate?: string;

  @Column({ type: 'boolean', name: 'do_not_call', default: false })
  doNotCall: boolean;

  @Column({ type: 'boolean', name: 'litigious_flag', default: false })
  litigiousFlag: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column('jsonb', { name: 'custom_fields', nullable: true })
  customFields?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
