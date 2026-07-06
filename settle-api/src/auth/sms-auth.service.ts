import { Injectable, Logger } from '@nestjs/common';
import { TelnyxService } from './telnyx.service';

@Injectable()
export class SmsAuthService {
  private readonly logger = new Logger(SmsAuthService.name);
  private otpStore: Map<string, { code: string; expires: number }> = new Map();

  constructor(private telnyxService: TelnyxService) {}

  async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;
    this.otpStore.set(phone, { code, expires });

    const result = await this.telnyxService.sendOTP(phone, code);
    if (!result.success) {
      this.logger.error('Failed to send OTP:', result.error);
    }
    return result;
  }

  verifyOTP(phone: string, code: string): { success: boolean; error?: string } {
    const stored = this.otpStore.get(phone);
    if (!stored) {
      return { success: false, error: 'No OTP sent for this phone number' };
    }
    if (Date.now() > stored.expires) {
      this.otpStore.delete(phone);
      return { success: false, error: 'OTP expired' };
    }
    if (stored.code !== code) {
      return { success: false, error: 'Invalid code' };
    }
    this.otpStore.delete(phone);
    return { success: true };
  }
}
