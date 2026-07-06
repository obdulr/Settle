import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelnyxService {
  private readonly logger = new Logger(TelnyxService.name);
  private apiKey: string;
  private fromNumber: string;

  constructor() {
    this.apiKey = process.env.TELNYX_API_KEY || '';
    this.fromNumber = process.env.TELNYX_PHONE_NUMBER || '';
  }

  async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      if (!this.apiKey || !this.fromNumber) {
        this.logger.warn('Telnyx not configured');
        return { success: false, error: 'Telnyx not configured' };
      }

      const response = await axios.post(
        'https://api.telnyx.com/v2/messages',
        { from: this.fromNumber, to: phoneNumber, text: message },
        { headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' } },
      );

      if (response.data?.data?.id) {
        return { success: true, messageId: response.data.data.id };
      }
      return { success: false, error: 'No message ID returned' };
    } catch (error: any) {
      this.logger.error('Failed to send Telnyx SMS:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.errors?.[0]?.detail || error.message };
    }
  }

  async sendOTP(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
    const message = `Settle: Your verification code is ${code}. It expires in 10 minutes.`;
    return this.sendSMS(phoneNumber, message);
  }
}
