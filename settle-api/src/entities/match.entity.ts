import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('matches')
@Index(['leadId', 'providerId'], { unique: true })
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'lead_id' })
  @Index()
  leadId!: string;

  @Column({ type: 'uuid', name: 'provider_id' })
  @Index()
  providerId!: string;

  @Column({ type: 'int' })
  matchScore!: number; // 0-100, how well lead matches provider

  @Column({ type: 'simple-json', nullable: true })
  matchReasons?: string[]; // e.g. ["state_match", "debt_type_match", "debt_amount_in_range"]

  @Column({ type: 'varchar', length: 50, default: 'suggested' })
  status!: string; // suggested, viewed, requested, declined, purchased, expired

  @Column({ type: 'timestamp', nullable: true })
  viewedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  requestedAt?: Date; // consumer requested contact from this provider

  @Column({ type: 'timestamp', nullable: true })
  declinedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'email_sent_at' })
  emailSentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
