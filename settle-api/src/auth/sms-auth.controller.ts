import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SmsAuthService } from './sms-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth/sms')
export class SmsAuthController {
  constructor(private smsAuthService: SmsAuthService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  async sendOTP(@Body() body: { phone: string }) {
    return this.smsAuthService.sendOTP(body.phone);
  }

  @Post('verify')
  verifyOTP(@Body() body: { phone: string; code: string }) {
    return this.smsAuthService.verifyOTP(body.phone, body.code);
  }
}
