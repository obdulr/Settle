import { Controller, Post, Body, UseGuards, Request, Get, UsePipes, ValidationPipe, Put } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for login
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UsePipes(new ValidationPipe())
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour for registration
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @UsePipes(new ValidationPipe())
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour for password reset
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @UsePipes(new ValidationPipe())
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour for reset
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UsePipes(new ValidationPipe())
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour for verification
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour for resend
  @Post('resend-verification')
  async resendVerificationEmail(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, updateProfileDto);
  }

  // ============================================================
  // OTP via Email
  // ============================================================

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 per minute
  @Post('send-otp')
  async sendEmailOtp(@Body() body: { email: string }) {
    return this.authService.sendEmailOtp(body.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
  @Post('verify-otp')
  async verifyEmailOtp(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmailOtp(body.email, body.code);
  }
}