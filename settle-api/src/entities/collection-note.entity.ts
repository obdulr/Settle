import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CollectionNoteType {
  CALL = 'call',
  EMAIL = 'email',
  SMS = 'sms',
  LETTER = 'letter',
  PAYMENT = 'payment',
  SKIP_TRACE = 'skip_trace',
  LEGAL = 'legal',
  CREDIT_REPORT = 'credit_report',
  BACKGROUND_CHECK = 'background_check',
  GENERAL = 'general',
}

@Entity('collection_notes')
export class CollectionNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'collection_account_id' })
  @Index()
  collectionAccountId: string;

  @Column({ name: 'author_id', nullable: true })
  @Index()
  authorId?: string;

  @Column({
    type: 'enum',
    enum: CollectionNoteType,
    default: CollectionNoteType.GENERAL,
    name: 'note_type',
  })
  noteType: CollectionNoteType;

  @Column({ type: 'text' })
  content: string;

  @Column('jsonb', { name: 'metadata', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
