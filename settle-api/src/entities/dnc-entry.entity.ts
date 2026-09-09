import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('crm_dnc_list')
export class DncEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  @Index()
  phoneNumber: string;

  @Column({ length: 10, nullable: true })
  @Index()
  state?: string;

  @Column({ name: 'source', length: 100, nullable: true })
  source?: string; // federal_dnc, internal, customer_request, compliance

  @Column({ type: 'timestamp', name: 'added_at' })
  addedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
