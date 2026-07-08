import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@settleinpeace.com';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged to console only');
    }
  }

  async sendOtpEmail(toEmail: string, code: string, firstName?: string): Promise<boolean> {
    const subject = 'Your Settle In Peace verification code';
    const html = this.renderOtpTemplate(code, firstName);

    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${toEmail} | Subject: ${subject} | Code: ${code}`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send OTP email: ${error.message}`);
        return false;
      }

      this.logger.log(`OTP email sent to ${toEmail}`);
      return true;
    } catch (err) {
      this.logger.error(`Email send error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  async sendVerificationEmail(toEmail: string, token: string, firstName?: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3025';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    const subject = 'Verify your email — Settle In Peace';
    const html = this.renderVerificationTemplate(verifyUrl, firstName);

    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${toEmail} | Subject: ${subject} | Verify URL: ${verifyUrl}`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send verification email: ${error.message}`);
        return false;
      }

      this.logger.log(`Verification email sent to ${toEmail}`);
      return true;
    } catch (err) {
      this.logger.error(`Email send error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  async sendPasswordResetEmail(toEmail: string, token: string, firstName?: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3025';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const subject = 'Reset your password — Settle In Peace';
    const html = this.renderPasswordResetTemplate(resetUrl, firstName);

    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${toEmail} | Subject: ${subject} | Reset URL: ${resetUrl}`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send password reset email: ${error.message}`);
        return false;
      }

      this.logger.log(`Password reset email sent to ${toEmail}`);
      return true;
    } catch (err) {
      this.logger.error(`Email send error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  async sendWelcomeEmail(toEmail: string, firstName?: string): Promise<boolean> {
    const subject = 'Welcome to Settle In Peace';
    const html = this.renderWelcomeTemplate(firstName);

    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${toEmail} | Subject: ${subject}`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send welcome email: ${error.message}`);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error(`Email send error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  async sendProviderApprovalEmail(toEmail: string, companyName: string): Promise<boolean> {
    const subject = 'Your provider account has been approved — Settle In Peace';
    const html = this.renderProviderApprovalTemplate(companyName);

    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${toEmail} | Subject: ${subject}`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send provider approval email: ${error.message}`);
        return false;
      }

      this.logger.log(`Provider approval email sent to ${toEmail}`);
      return true;
    } catch (err) {
      this.logger.error(`Email send error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  async sendProviderRejectionEmail(toEmail: string, companyName: string, reason?: string): Promise<boolean> {
    const subject = 'Your provider application was not approved — Settle In Peace';
    const html = this.renderProviderRejectionTemplate(companyName, reason);

    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${toEmail} | Subject: ${subject}`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send provider rejection email: ${error.message}`);
        return false;
      }

      this.logger.log(`Provider rejection email sent to ${toEmail}`);
      return true;
    } catch (err) {
      this.logger.error(`Email send error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  private renderVerificationTemplate(verifyUrl: string, firstName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">Settle<span style="color: #60a5fa;">InPeace</span></h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px;">Verify your email</h2>
        <p style="color: #71717a; font-size: 16px; line-height: 1.6;">
          Hi${firstName ? ` ${firstName}` : ''}, welcome to Settle In Peace! Click the button below to verify your email address.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; font-weight: 700; padding: 12px 32px; border-radius: 8px;">Verify Email</a>
        </div>
        <p style="color: #a1a1aa; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
        <p style="color: #a1a1aa; font-size: 12px;">Settle In Peace, Inc. — The debt relief marketplace that puts you in control.</p>
      </body>
      </html>
    `;
  }

  private renderPasswordResetTemplate(resetUrl: string, firstName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">Settle<span style="color: #60a5fa;">InPeace</span></h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px;">Reset your password</h2>
        <p style="color: #71717a; font-size: 16px; line-height: 1.6;">
          Hi${firstName ? ` ${firstName}` : ''}, we received a request to reset your password. Click the button below to choose a new one.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; font-weight: 700; padding: 12px 32px; border-radius: 8px;">Reset Password</a>
        </div>
        <p style="color: #a1a1aa; font-size: 14px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
        <p style="color: #a1a1aa; font-size: 12px;">Settle In Peace, Inc. — The debt relief marketplace that puts you in control.</p>
      </body>
      </html>
    `;
  }

  private renderOtpTemplate(code: string, firstName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">Settle<span style="color: #60a5fa;">InPeace</span></h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px;">Your verification code</h2>
        <p style="color: #71717a; font-size: 16px; line-height: 1.6;">
          Hi${firstName ? ` ${firstName}` : ''}, use the code below to verify your email and continue.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; background: #eff6ff; padding: 16px 32px; border-radius: 12px;">
            ${code}
          </div>
        </div>
        <p style="color: #a1a1aa; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
        <p style="color: #a1a1aa; font-size: 12px;">Settle In Peace, Inc. — The debt relief marketplace that puts you in control.</p>
      </body>
      </html>
    `;
  }

  private renderWelcomeTemplate(firstName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">Settle<span style="color: #60a5fa;">InPeace</span></h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px;">Welcome${firstName ? `, ${firstName}` : ''}!</h2>
        <p style="color: #71717a; font-size: 16px; line-height: 1.6;">
          Thanks for joining Settle In Peace. We're building the first marketplace for debt relief — compare providers side-by-side with transparent fees, real timelines, and no pressure.
        </p>
        <p style="color: #71717a; font-size: 16px; line-height: 1.6;">
          Take the free assessment to see your options, or browse our marketplace to learn how it works.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://settleinpeace.com'}/assessment" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; font-weight: 700; padding: 12px 32px; border-radius: 8px;">Take the Free Assessment</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
        <p style="color: #a1a1aa; font-size: 12px;">Settle In Peace, Inc. — The debt relief marketplace that puts you in control.</p>
      </body>
      </html>
    `;
  }

  private renderProviderApprovalTemplate(companyName: string): string {
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3025';
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">Settle<span style="color: #60a5fa;">InPeace</span></h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px;">Your provider account has been approved</h2>
        <p style="color: #71717a; font-size: 16px; line-height: 1.6;">
          Great news! The provider account for <strong>${companyName}</strong> has been reviewed and approved. You can now log in to your provider portal to start receiving leads and managing your marketplace presence.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${portalUrl}/providers/portal" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; font-weight: 700; padding: 12px 32px; border-radius: 8px;">Go to Provider Portal</a>
        </div>
        <p style="color: #a1a1aa; font-size: 14px;">If you have any questions, our team is here to help.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
        <p style="color: #a1a1aa; font-size: 12px;">Settle In Peace, Inc. — The debt relief marketplace that puts you in control.</p>
      </body>
      </html>
    `;
  }

  private renderProviderRejectionTemplate(companyName: string, reason?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">Settle<span style="color: #60a5fa;">InPeace</span></h1>
        </div>
        <h2 style="color: #18181b; font-size: 20px;">Your provider application was not approved</h2>
        <p style="color: #71717a; font-size: 16px; line-height: 1.6;">
          Thank you for your interest in joining the Settle In Peace marketplace. After reviewing the application for <strong>${companyName}</strong>, we are unable to approve the account at this time.
        </p>
        ${reason ? `<p style="color: #71717a; font-size: 16px; line-height: 1.6;"><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="color: #71717a; font-size: 16px; line-height: 1.6;">
          If you believe this was in error or would like to reapply in the future, please contact our team.
        </p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
        <p style="color: #a1a1aa; font-size: 12px;">Settle In Peace, Inc. — The debt relief marketplace that puts you in control.</p>
      </body>
      </html>
    `;
  }
}
