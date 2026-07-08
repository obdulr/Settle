import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: true })
  password!: string; // Bcrypt hashed

  // Valid roles: 'customer', 'provider', 'admin'
  @Column({ type: 'varchar', length: 50, default: 'customer', nullable: true })
  role?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  // Email verification
  @Column({ name: 'email_verified', type: 'boolean', default: false, nullable: true })
  emailVerified?: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken?: string;

  @Column({ name: 'email_verification_expires', type: 'timestamp', nullable: true })
  emailVerificationExpires?: Date;

  // Phone verification
  @Column({ name: 'phone_verified', type: 'boolean', default: false, nullable: true })
  phoneVerified?: boolean;

  // Passkey / WebAuthn fields
  @Column({ name: 'passkey_credential_id', nullable: true })
  passkeyCredentialId?: string;

  @Column({ name: 'passkey_public_key', type: 'bytea', nullable: true })
  passkeyPublicKey?: Buffer;

  @Column({ name: 'passkey_counter', type: 'int', default: 0, nullable: true })
  passkeyCounter?: number;

  @Column({ name: 'passkey_transports', type: 'text', nullable: true })
  passkeyTransports?: string; // JSON array stored as text

  @Column({ name: 'passkey_verified_at', type: 'timestamp', nullable: true })
  passkeyVerifiedAt?: Date;

  // OTP via email fields
  @Column({ name: 'otp_code', length: 10, nullable: true, select: false })
  otpCode?: string;

  @Column({ name: 'otp_expires', type: 'timestamp', nullable: true })
  otpExpires?: Date;

  @Column({ name: 'otp_attempts', type: 'int', default: 0, nullable: true })
  otpAttempts?: number;

  // Security fields
  @Column({ name: 'failed_login_attempts', type: 'int', default: 0, nullable: true })
  failedLoginAttempts?: number;

  @Column({ name: 'last_failed_login_at', type: 'timestamp', nullable: true })
  lastFailedLoginAt?: Date;

  @Column({ name: 'lockout_expires_at', type: 'timestamp', nullable: true })
  lockoutExpiresAt?: Date;

  @Column({ name: 'account_locked', type: 'boolean', default: false, nullable: true })
  accountLocked?: boolean;

  @Column({ name: 'last_password_change_at', type: 'timestamp', nullable: true })
  lastPasswordChangeAt?: Date;

  // Password reset
  @Column({ name: 'reset_token', length: 255, nullable: true, select: false })
  resetToken?: string;

  @Column({ name: 'reset_token_expires', type: 'timestamp', nullable: true })
  resetTokenExpires?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
