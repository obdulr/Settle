import { Controller, Post, Get, Body, Req, Headers, Param, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { BillingService } from './billing.service';
import { BankingWebhookDto, SubmitDepositDto, ManualDepositDto, RejectDepositDto } from './billing.dto';

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  // Generic bank/payment-processor webhook
  @Post('webhooks/banking')
  async handleBankingWebhook(
    @Body() dto: BankingWebhookDto,
    @Headers('x-banking-webhook-secret') signature?: string,
  ) {
    this.billingService.verifyWebhookSignature(signature);
    return this.billingService.processBankingWebhook(dto);
  }

  // Provider: submit a deposit they have sent
  @Post('deposits')
  @UseGuards(JwtAuthGuard)
  async submitDeposit(@Req() req: Request & { user: any }, @Body() dto: SubmitDepositDto) {
    return this.billingService.submitDeposit(req.user.sub, dto);
  }

  // Provider: view their own deposit history
  @Get('deposits')
  @UseGuards(JwtAuthGuard)
  async getMyDeposits(@Req() req: Request & { user: any }, @Query('status') status?: string) {
    return this.billingService.getDeposits({ providerId: req.user.sub, status });
  }

  // Admin: list all deposits (exceptions + history)
  @Get('admin/deposits')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllDeposits(@Query('status') status?: string) {
    return this.billingService.getDeposits({ status });
  }

  // Admin: create a manual deposit and credit provider immediately
  @Post('admin/deposits')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async manualDeposit(@Req() req: Request & { user: any }, @Body() dto: ManualDepositDto) {
    return this.billingService.manualDeposit(req.user.sub, dto);
  }

  // Admin: approve a pending/unmatched deposit
  @Post('admin/deposits/:id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approveDeposit(@Req() req: Request & { user: any }, @Param('id') id: string) {
    return this.billingService.approveDeposit(id, req.user.sub);
  }

  // Admin: reject a deposit
  @Post('admin/deposits/:id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async rejectDeposit(@Param('id') id: string, @Body() dto: RejectDepositDto) {
    return this.billingService.rejectDeposit(id, dto.reason);
  }

  // Admin: manually trigger subscription renewal sweep
  @Post('admin/run-renewals')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async runRenewals() {
    await this.billingService.processRenewals();
    return { success: true };
  }
}
