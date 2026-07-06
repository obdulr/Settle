import { Controller, Post, Body } from '@nestjs/common';
import { SmsAuthService } from './sms-auth.service';

@Controller('auth/sms')
export class SmsAuthController {
  constructor(private smsAuthService: SmsAuthService) {}

  @Post('send')
  async sendOTP(@Body() body: { phone: string }) {
    return this.smsAuthService.sendOTP(body.phone);
  }

  @Post('verify')
  verifyOTP(@Body() body: { phone: string; code: string }) {
    return this.smsAuthService.verifyOTP(body.phone, body.code);
  }
}
