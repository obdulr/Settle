import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DebtSettlementService } from './debt-settlement.service';
import { LeadRoutingRule } from '../entities/lead-routing-rule.entity';
import { AssignmentStatus } from '../entities/lead-assignment.entity';
import { ConsentType, ConsentMethod } from '../entities/consent-log.entity';
import {
  CommunicationType,
  CommunicationDirection,
  CommunicationStatus,
} from '../entities/communication-log.entity';
import { TaskType, TaskPriority, TaskStatus } from '../entities/crm-task.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('crm/debt-settlement')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DebtSettlementController {
  constructor(private readonly dsService: DebtSettlementService) {}

  // ===========================================================================
  // LEAD ROUTING & DISTRIBUTION
  // ===========================================================================

  @Get('routing-rules')
  async listRoutingRules(@Query('groupId') groupId?: string) {
    return this.dsService.listRoutingRules(groupId);
  }

  @Post('routing-rules')
  async createRoutingRule(@Body() body: Partial<LeadRoutingRule>) {
    return this.dsService.createRoutingRule(body);
  }

  @Patch('routing-rules/:id')
  async updateRoutingRule(@Param('id') id: string, @Body() body: Partial<LeadRoutingRule>) {
    return this.dsService.updateRoutingRule(id, body);
  }

  @Post('route-lead')
  async routeLead(
    @Body('leadId') leadId: string,
    @Body('debtAmount') debtAmount?: number,
    @Body('state') state?: string,
    @Body('debtTypes') debtTypes?: string[],
    @Body('groupId') groupId?: string,
  ) {
    return this.dsService.routeLead(leadId, debtAmount, state, debtTypes, groupId);
  }

  @Post('leads/:leadId/claim')
  async claimLead(@Param('leadId') leadId: string, @Body('agentId') agentId: string) {
    return this.dsService.claimLead(leadId, agentId);
  }

  @Get('assignments')
  async getAssignments(
    @Query('leadId') leadId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('status') status?: AssignmentStatus,
  ) {
    return this.dsService.getLeadAssignments(leadId, assignedTo, status);
  }

  @Get('unworked-leads')
  async getUnworkedLeads(@Query('hours') hours?: number, @Query('groupId') groupId?: string) {
    return this.dsService.getUnworkedLeads(hours ?? 24, groupId);
  }

  @Post('redistribute')
  async redistributeLeads(@Query('hours') hours?: number, @Query('groupId') groupId?: string) {
    return this.dsService.redistributeLeads(hours ?? 24, groupId);
  }

  @Get('shark-tank')
  async getSharkTankLeads(@Query('groupId') groupId?: string) {
    return this.dsService.getSharkTankLeads(groupId);
  }

  // ===========================================================================
  // COMPLIANCE — DNC
  // ===========================================================================

  @Get('dnc/check/:phoneNumber')
  async checkDnc(@Param('phoneNumber') phoneNumber: string) {
    const isOnDnc = await this.dsService.checkDnc(phoneNumber);
    return { phoneNumber, isOnDnc };
  }

  @Post('dnc')
  async addToDnc(
    @Body('phoneNumber') phoneNumber: string,
    @Body('source') source?: string,
    @Body('state') state?: string,
    @Body('notes') notes?: string,
    @Body('groupId') groupId?: string,
  ) {
    return this.dsService.addToDnc(phoneNumber, source, state, notes, groupId);
  }

  @Delete('dnc/:phoneNumber')
  async removeFromDnc(@Param('phoneNumber') phoneNumber: string) {
    await this.dsService.removeFromDnc(phoneNumber);
    return { success: true };
  }

  @Get('dnc')
  async listDncEntries(@Query('groupId') groupId?: string, @Query('limit') limit?: number) {
    return this.dsService.listDncEntries(groupId, limit ?? 100);
  }

  // ===========================================================================
  // COMPLIANCE — Consent
  // ===========================================================================

  @Post('consent')
  async logConsent(@Body() body: {
    leadId?: string;
    clientId?: string;
    phoneNumber?: string;
    emailAddress?: string;
    consentType: ConsentType;
    consentMethod: ConsentMethod;
    granted: boolean;
    consentLanguage?: string;
    ipAddress?: string;
    userAgent?: string;
    pageVersion?: string;
    expiresAt?: Date;
    groupId?: string;
  }) {
    return this.dsService.logConsent(body);
  }

  @Get('consent/history')
  async getConsentHistory(
    @Query('leadId') leadId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.dsService.getConsentHistory(leadId, clientId);
  }

  // ===========================================================================
  // COMMUNICATION LOGGING
  // ===========================================================================

  @Post('communications')
  async logCommunication(@Body() body: {
    leadId?: string;
    clientId?: string;
    userId?: string;
    communicationType: CommunicationType;
    direction: CommunicationDirection;
    status?: CommunicationStatus;
    fromNumber?: string;
    toNumber?: string;
    fromEmail?: string;
    toEmail?: string;
    subject?: string;
    body?: string;
    durationSeconds?: number;
    wasRecorded?: boolean;
    recordingUrl?: string;
    transcriptUrl?: string;
    aiInsights?: Record<string, any>;
    connectedAt?: Date;
    endedAt?: Date;
    groupId?: string;
  }) {
    return this.dsService.logCommunication(body);
  }

  @Get('communications')
  async getCommunications(
    @Query('leadId') leadId?: string,
    @Query('clientId') clientId?: string,
    @Query('type') type?: CommunicationType,
    @Query('limit') limit?: number,
  ) {
    return this.dsService.getCommunicationHistory(leadId, clientId, type, limit ?? 50);
  }

  // ===========================================================================
  // TASKS & CALLBACKS
  // ===========================================================================

  @Get('tasks')
  async listTasks(
    @Query('assignedTo') assignedTo?: string,
    @Query('leadId') leadId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: TaskStatus,
    @Query('type') type?: TaskType,
    @Query('groupId') groupId?: string,
  ) {
    return this.dsService.listTasks(assignedTo, leadId, clientId, status, type, groupId);
  }

  @Post('tasks')
  async createTask(@Body() body: {
    type?: TaskType;
    title: string;
    description?: string;
    priority?: TaskPriority;
    leadId?: string;
    clientId?: string;
    enrollmentId?: string;
    settlementId?: string;
    assignedTo: string;
    assignedBy?: string;
    dueDate: Date;
    autoReminder?: boolean;
    reminderMinutesBefore?: number;
    metadata?: Record<string, any>;
    groupId?: string;
  }) {
    return this.dsService.createTask(body);
  }

  @Post('tasks/:id/complete')
  async completeTask(@Param('id') id: string) {
    return this.dsService.completeTask(id);
  }

  @Post('tasks/:id/cancel')
  async cancelTask(@Param('id') id: string) {
    return this.dsService.cancelTask(id);
  }

  @Get('tasks/upcoming')
  async getUpcomingTasks(
    @Query('assignedTo') assignedTo?: string,
    @Query('hoursAhead') hoursAhead?: number,
    @Query('groupId') groupId?: string,
  ) {
    return this.dsService.getUpcomingTasks(assignedTo, hoursAhead ?? 24, groupId);
  }

  @Get('tasks/overdue')
  async getOverdueTasks(
    @Query('assignedTo') assignedTo?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.dsService.getOverdueTasks(assignedTo, groupId);
  }

  @Get('tasks/today')
  async getTasksDueToday(
    @Query('assignedTo') assignedTo?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.dsService.getTasksDueToday(assignedTo, groupId);
  }

  // ===========================================================================
  // AI LEAD SCORING
  // ===========================================================================

  @Post('score-lead/:leadId')
  async scoreLead(@Param('leadId') leadId: string) {
    return this.dsService.scoreLead(leadId);
  }

  // ===========================================================================
  // REPORTING & ANALYTICS
  // ===========================================================================

  @Get('operations-report')
  async getOperationsReport(@Query('groupId') groupId?: string) {
    return this.dsService.getOperationsReport(groupId);
  }
}
