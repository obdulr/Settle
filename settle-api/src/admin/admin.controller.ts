import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  /** List all providers (all statuses). */
  @Get('providers')
  async getAllProviders() {
    return this.adminService.getAllProviders();
  }

  /** List providers awaiting approval. */
  @Get('providers/pending')
  async getPendingProviders() {
    return this.adminService.getPendingProviders();
  }

  /** Approve a provider — sets status to 'active' and sends approval email. */
  @Post('providers/:id/approve')
  async approveProvider(@Param('id') id: string) {
    return this.adminService.approveProvider(id);
  }

  /** Reject a provider — sets status to 'rejected' and sends rejection email. */
  @Post('providers/:id/reject')
  async rejectProvider(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.rejectProvider(id, reason);
  }

  /** Suspend a provider — sets status to 'suspended'. */
  @Post('providers/:id/suspend')
  async suspendProvider(@Param('id') id: string) {
    return this.adminService.suspendProvider(id);
  }

  /** Adjust a provider's credit balance (body: { amount, reason }). */
  @Post('providers/:id/adjust-credits')
  async adjustProviderCredits(
    @Param('id') id: string,
    @Body() body: { amount: number; reason?: string },
  ) {
    return this.adminService.adjustProviderCredits(id, body.amount, body.reason);
  }

  /** List all leads with pagination (query params: page, limit, status). */
  @Get('leads')
  async getAllLeads(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAllLeads(p, l, status);
  }

  /** Lead statistics (total, by status, by quality score range, conversion rate). */
  @Get('leads/stats')
  async getLeadStats() {
    return this.adminService.getLeadStats();
  }

  /** Manually assign a lead to a provider (body: { providerId, price? }). */
  @Post('leads/:id/manual-assign')
  async manualAssignLead(
    @Param('id') id: string,
    @Body() body: { providerId: string; price?: number },
  ) {
    return this.adminService.manualAssignLead(id, body.providerId, body.price);
  }

  /** View all matches with pagination. */
  @Get('matches')
  async getAllMatches(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAllMatches(p, l);
  }
}
