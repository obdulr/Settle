import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  ALERT = 'alert',
  REMINDER = 'reminder',
  INFO = 'info',
  WARNING = 'warning',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationTargetRole {
  AGENT = 'agent',
  MANAGER = 'manager',
  CLIENT = 'client',
  ADMIN = 'admin',
}

@Entity('crm_notifications')
export class CrmNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({
    type: 'enum',
    enum: NotificationTargetRole,
    name: 'target_role',
    nullable: true,
  })
  targetRole?: NotificationTargetRole;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    name: 'notification_channel',
    default: NotificationChannel.IN_APP,
  })
  notificationChannel: NotificationChannel;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', name: 'read_at', nullable: true })
  readAt?: Date;

  @Column({ name: 'lead_id', nullable: true })
  @Index()
  leadId?: string;

  @Column({ name: 'client_id', nullable: true })
  @Index()
  clientId?: string;

  @Column({ name: 'enrollment_id', nullable: true })
  @Index()
  enrollmentId?: string;

  @Column({ name: 'settlement_id', nullable: true })
  @Index()
  settlementId?: string;

  @Column({ type: 'jsonb', name: 'action_url', nullable: true })
  actionUrl?: { url: string; label: string };

  @Column({ name: 'group_id', nullable: true })
  @Index()
  groupId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
