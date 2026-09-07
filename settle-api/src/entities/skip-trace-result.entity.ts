import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SkipTraceStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
  MANUAL = 'manual',
}

@Entity('skip_trace_results')
export class SkipTraceResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'collection_account_id' })
  @Index()
  collectionAccountId: string;

  @Column({ name: 'requested_by', nullable: true })
  @Index()
  requestedBy?: string;

  @Column({ length: 100, default: 'manual' })
  provider: string;

  @Column({
    type: 'enum',
    enum: SkipTraceStatus,
    default: SkipTraceStatus.PENDING,
  })
  status: SkipTraceStatus;

  @Column({ name: 'search_criteria', type: 'jsonb', nullable: true })
  searchCriteria?: {
    firstName?: string;
    lastName?: string;
    ssnLast4?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  addresses?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    type?: string;
    confidence?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  phones?: { number?: string; type?: string; confidence?: string }[];

  @Column({ type: 'jsonb', nullable: true })
  emails?: { address?: string; type?: string; confidence?: string }[];

  @Column({ type: 'jsonb', name: 'relatives', nullable: true })
  relatives?: { name?: string; relationship?: string; phone?: string; address?: string }[];

  @Column({ type: 'jsonb', name: 'workplaces', nullable: true })
  workplaces?: { name?: string; title?: string; address?: string; phone?: string }[];

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  confidence: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', name: 'raw_response', nullable: true })
  rawResponse?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
