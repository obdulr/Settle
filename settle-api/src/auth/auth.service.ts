import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private activitiesService: ActivitiesService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
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

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    
    // Log login activity
    await this.activitiesService.createActivity(
      user.id,
      'login',
      'User logged in',
      { email: user.email }
    );
    
    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
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

    // TODO: Send verification email
    // For now, return the token for testing
    const tokens = await this.generateTokens(user);
    
    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      verificationToken: verificationToken, // Remove this in production
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

    // TODO: Send email with reset link
    // For now, return the token for testing
    return { 
      success: true, 
      message: 'Password reset link sent',
      resetToken // Remove this in production
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

    // TODO: Send verification email
    return { 
      success: true, 
      message: 'Verification email sent',
      verificationToken // Remove this in production
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
}