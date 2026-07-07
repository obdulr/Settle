import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Provider } from '../entities/provider.entity';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ActivitiesService } from '../activities/activities.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Provider)
    private providersRepository: Repository<Provider>,
    private jwtService: JwtService,
    private activitiesService: ActivitiesService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Check regular users first
    const user = await this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
    if (user) {
      if (!user.password) return null;
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return null;
      const { password: _, ...result } = user;
      return result;
    }

    // Check providers
    const provider = await this.providersRepository
      .createQueryBuilder('p')
      .addSelect('p.password')
      .where('p.email = :email', { email })
      .getOne();
    if (provider) {
      if (!provider.password) return null;
      const isPasswordValid = await bcrypt.compare(password, provider.password);
      if (!isPasswordValid) return null;
      const { password: _, ...result } = provider;
      // Normalize provider to look like a user for token generation
      return {
        ...result,
        role: 'provider',
        firstName: provider.companyName,
        lastName: '',
        phone: provider.phone || '',
      };
    }

    return null;
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'customer',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
      secret: process.env.JWT_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return { accessToken, refreshToken, expiresIn: 30 * 24 * 60 * 60 }; // 30 days in seconds
  }

  // Public method for passkey login (called from WebAuthnController)
  async generateTokensForUser(user: any) {
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    
    // Log login activity (skip for providers — they don't have an activities table row)
    if (user.role !== 'provider') {
      try {
        await this.activitiesService.createActivity(
          user.id,
          'login',
          'User logged in',
          { email: user.email }
        );
      } catch {
        // Activity logging is non-critical
      }
    }
    
    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'customer',
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: registerDto.email } 
    });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const verificationToken = this.generateSecureToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    const user = this.usersRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: 'customer',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await this.usersRepository.save(user);

    // Log registration activity
    await this.activitiesService.createActivity(
      user.id,
      'register',
      'User registered',
      { email: user.email, firstName: user.firstName, lastName: user.lastName }
    );

    // Send verification email (logged to console in dev mode when no RESEND_API_KEY)
    await this.emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);

    const tokens = await this.generateTokens(user);
    
    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'customer',
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({ 
      where: { email: forgotPasswordDto.email } 
    });
    
    if (!user) {
      // Don't reveal if email exists for security
      return { success: true, message: 'If email exists, password reset link sent' };
    }

    // Generate reset token
    const resetToken = this.generateSecureToken();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiration

    await this.usersRepository.update(user.id, {
      resetToken,
      resetTokenExpires,
    });

    // Send password reset email (logged to console in dev mode when no RESEND_API_KEY)
    await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);

    return {
      success: true,
      message: 'Password reset link sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersRepository.findOne({ 
      where: { resetToken: resetPasswordDto.token } 
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

    await this.usersRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
      lastPasswordChangeAt: new Date(),
    });

    return { success: true, message: 'Password reset successfully' };
  }

  private generateSecureToken(): string {
    // Generate a cryptographically secure random token
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16)).join('');
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersRepository.findOne({ 
      where: { emailVerificationToken: verifyEmailDto.token } 
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.usersRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    return { success: true, message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if email exists for security
      return { success: true, message: 'If email exists, verification link sent' };
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email already verified' };
    }

    const verificationToken = this.generateSecureToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await this.usersRepository.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);

    return {
      success: true,
      message: 'Verification email sent',
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ 
        where: { email: updateProfileDto.email } 
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    await this.usersRepository.update(userId, {
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      email: updateProfileDto.email,
      phone: updateProfileDto.phone,
    });

    // Log profile update activity
    await this.activitiesService.createActivity(
      userId,
      'profile_update',
      'User updated profile',
      { changes: updateProfileDto }
    );

    const updatedUser = await this.usersRepository.findOne({ where: { id: userId } });
    const { password: _, ...result } = updatedUser!;
    return result;
  }

  // ============================================================
  // OTP via Email
  // ============================================================

  async sendEmailOtp(email: string): Promise<{ success: boolean; message: string; devCode?: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists for security
      return { success: true, message: 'If an account exists, a verification code was sent' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10); // 10 minute expiry

    await this.usersRepository.update(user.id, {
      otpCode: code,
      otpExpires: expires,
      otpAttempts: 0,
    });

    const sent = await this.emailService.sendOtpEmail(email, code, user.firstName);

    // In dev mode (no RESEND_API_KEY), return the code for testing
    if (!process.env.RESEND_API_KEY) {
      return { success: true, message: 'Verification code sent (dev mode)', devCode: code };
    }

    if (!sent) {
      return { success: false, message: 'Failed to send verification code' };
    }

    return { success: true, message: 'Verification code sent to your email' };
  }

  async verifyEmailOtp(email: string, code: string) {
    // Use a query builder to select the otpCode column (it's select: false in entity)
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.otpCode')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or code');
    }

    if (!user.otpCode || !user.otpExpires) {
      throw new BadRequestException('No verification code was sent. Please request a new code.');
    }

    if (user.otpExpires < new Date()) {
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    // Check attempt limit
    if ((user.otpAttempts || 0) >= 5) {
      throw new BadRequestException('Too many attempts. Please request a new code.');
    }

    if (user.otpCode !== code) {
      await this.usersRepository.update(user.id, {
        otpAttempts: (user.otpAttempts || 0) + 1,
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    // Clear OTP and mark email verified
    await this.usersRepository.update(user.id, {
      otpCode: null,
      otpExpires: null,
      otpAttempts: 0,
      emailVerified: true,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    await this.activitiesService.createActivity(
      user.id,
      'otp_login',
      'User logged in via email OTP',
      { email: user.email },
    );

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'customer',
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  }
}