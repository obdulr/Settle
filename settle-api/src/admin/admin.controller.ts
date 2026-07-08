import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
}
