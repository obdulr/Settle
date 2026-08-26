import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import type { CreateCrmLeadInput, UpdateCrmLeadInput, CreateCrmDealInput } from './crm.service';
import { CrmLeadStatus } from '../entities/crm-lead.entity';
import type { CrmLeadSource } from '../entities/crm-lead.entity';
import { CrmDealStage } from '../entities/crm-deal.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ---------- Leads ----------

  @Get('leads')
  async listLeads(
    @Query('userId') userId?: string,
    @Query('groupId') groupId?: string,
    @Query('status') status?: CrmLeadStatus,
  ) {
    if (status) {
      return this.crmService.listLeadsByStatus(status, groupId);
    }
    return this.crmService.listLeads(userId, groupId);
  }

  @Post('leads')
  async createLead(@Body() body: CreateCrmLeadInput) {
    return this.crmService.createLead(body);
  }

  @Get('leads/:id')
  async getLead(@Param('id') id: string) {
    return this.crmService.getLead(id);
  }

  @Patch('leads/:id')
  async updateLead(@Param('id') id: string, @Body() body: UpdateCrmLeadInput) {
    return this.crmService.updateLead(id, body);
  }

  @Post('leads/:id/advance')
  async advanceLead(@Param('id') id: string) {
    return this.crmService.advanceLeadStage(id);
  }

  @Post('leads/:id/lose')
  async loseLead(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.crmService.loseLead(id, reason);
  }

  @Post('leads/:id/nurture')
  async nurtureLead(@Param('id') id: string) {
    return this.crmService.nurtureLead(id);
  }

  @Post('leads/:id/promote')
  async promoteLeadToClient(@Param('id') id: string) {
    return this.crmService.promoteLeadToClient(id);
  }

  // ---------- Deals ----------

  @Get('deals')
  async listDeals(
    @Query('userId') userId?: string,
    @Query('groupId') groupId?: string,
    @Query('status') status?: 'active' | 'won' | 'lost' | 'on_hold',
  ) {
    return this.crmService.listDeals(userId, groupId, status as any);
  }

  @Post('deals')
  async createDeal(@Body() body: CreateCrmDealInput) {
    return this.crmService.createDeal(body);
  }

  @Get('deals/:id')
  async getDeal(@Param('id') id: string) {
    return this.crmService.getDeal(id);
  }

  @Patch('deals/:id/stage')
  async updateDealStage(@Param('id') id: string, @Body('stage') stage: CrmDealStage) {
    return this.crmService.updateDealStage(id, stage);
  }

  @Post('deals/:id/lose')
  async loseDeal(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.crmService.loseDeal(id, reason);
  }

  // ---------- Clients ----------

  @Get('clients')
  async listClients(
    @Query('userId') userId?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.crmService.listClients(userId, groupId);
  }

  // ---------- Pipeline ----------

  @Get('pipeline')
  async getPipeline(
    @Query('userId') userId?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.crmService.getPipeline(userId, groupId);
  }

  @Get('dashboard')
  async getCrmData(@Query('userId') userId?: string) {
    return this.crmService.getCrmData(userId);
  }

  // ---------- Per-group CRM summary ----------

  @Get('groups/:groupId/summary')
  async getGroupCrmSummary(@Param('groupId') groupId: string) {
    return this.crmService.getGroupCrmSummary(groupId);
  }
}
