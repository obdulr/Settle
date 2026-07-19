import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { BatchPurchaseLeadsDto } from './dto/batch-purchase-leads.dto';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  // Public: consumer submits the assessment quiz
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('assessment')
  async submitAssessment(@Body() body: CreateLeadDto) {
    return this.leadsService.submitAssessment(body);
  }

  // Provider-only: see available leads in marketplace
  @SkipThrottle()
  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailableLeads() {
    return this.leadsService.getAvailableLeads();
  }

  // Provider-only: purchase a lead
  @SkipThrottle()
  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseLead(@Param('id') id: string, @Request() req) {
    // In production, req.user.sub would be the provider ID from their JWT
    return this.leadsService.purchaseLead(id, req.user.sub);
  }

  // Provider-only: view leads they purchased
  @SkipThrottle()
  @Get('my-leads')
  @UseGuards(JwtAuthGuard)
  async getMyLeads(@Request() req) {
    return this.leadsService.getLeadsByProvider(req.user.sub);
  }

  // Admin/internal: stats
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('stats')
  async getStats() {
    return this.leadsService.getLeadStats();
  }

  // Provider-only: full lead details before purchase (sensitive info masked)
  @SkipThrottle()
  @Get(':id/details')
  @UseGuards(JwtAuthGuard)
  async getLeadDetails(@Param('id') id: string, @Request() req) {
    return this.leadsService.getLeadDetails(id, req.user.sub);
  }

  // Provider-only: purchase multiple leads (body: { leadIds: string[] })
  @SkipThrottle()
  @Post('batch-purchase')
  @UseGuards(JwtAuthGuard)
  async batchPurchaseLeads(@Body() body: BatchPurchaseLeadsDto, @Request() req) {
    return this.leadsService.batchPurchaseLeads(body.leadIds, req.user.sub);
  }

  // Consumer: check if their lead has been purchased
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get(':id/status')
  async getLeadStatus(@Param('id') id: string) {
    return this.leadsService.getLeadStatus(id);
  }
}