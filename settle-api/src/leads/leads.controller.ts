import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  // Public: consumer submits the assessment quiz
  @Post('assessment')
  async submitAssessment(@Body() body: any) {
    return this.leadsService.submitAssessment(body);
  }

  // Provider-only: see available leads in marketplace
  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailableLeads() {
    return this.leadsService.getAvailableLeads();
  }

  // Provider-only: purchase a lead
  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseLead(@Param('id') id: string, @Request() req) {
    // In production, req.user.sub would be the provider ID from their JWT
    return this.leadsService.purchaseLead(id, req.user.sub);
  }

  // Provider-only: view leads they purchased
  @Get('my-leads')
  @UseGuards(JwtAuthGuard)
  async getMyLeads(@Request() req) {
    return this.leadsService.getLeadsByProvider(req.user.sub);
  }

  // Admin/internal: stats
  @Get('stats')
  async getStats() {
    return this.leadsService.getLeadStats();
  }

  // Provider-only: full lead details before purchase (sensitive info masked)
  @Get(':id/details')
  @UseGuards(JwtAuthGuard)
  async getLeadDetails(@Param('id') id: string, @Request() req) {
    return this.leadsService.getLeadDetails(id, req.user.sub);
  }

  // Provider-only: purchase multiple leads (body: { leadIds: string[] })
  @Post('batch-purchase')
  @UseGuards(JwtAuthGuard)
  async batchPurchaseLeads(@Body() body: { leadIds: string[] }, @Request() req) {
    return this.leadsService.batchPurchaseLeads(body.leadIds, req.user.sub);
  }

  // Consumer: check if their lead has been purchased
  @Get(':id/status')
  async getLeadStatus(@Param('id') id: string) {
    return this.leadsService.getLeadStatus(id);
  }
}