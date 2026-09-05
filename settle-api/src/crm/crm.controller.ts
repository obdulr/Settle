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
import { CreditorType } from '../entities/creditor.entity';
import { EnrollmentStatus, ProgramType } from '../entities/client-enrollment.entity';
import { SettlementStatus } from '../entities/settlement.entity';
import { SettlementPaymentType, SettlementPaymentStatus } from '../entities/settlement-payment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('crm')
@UseGuards(JwtAuthGuard, AdminGuard)
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

  // ===========================================================================
  // DEBT SETTLEMENT — Creditors
  // ===========================================================================

  @Get('creditors')
  async listCreditors(
    @Query('groupId') groupId?: string,
    @Query('type') type?: CreditorType,
  ) {
    return this.crmService.listCreditors(groupId, type);
  }

  @Get('creditors/:id')
  async getCreditor(@Param('id') id: string) {
    return this.crmService.getCreditor(id);
  }

  @Post('creditors')
  async createCreditor(@Body() body: Record<string, unknown>) {
    return this.crmService.createCreditor(body);
  }

  @Patch('creditors/:id')
  async updateCreditor(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.crmService.updateCreditor(id, body);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Enrollments
  // ===========================================================================

  @Get('enrollments')
  async listEnrollments(
    @Query('clientId') clientId?: string,
    @Query('status') status?: EnrollmentStatus,
    @Query('groupId') groupId?: string,
  ) {
    return this.crmService.listEnrollments(clientId, status, groupId);
  }

  @Get('enrollments/:id')
  async getEnrollment(@Param('id') id: string) {
    return this.crmService.getEnrollment(id);
  }

  @Post('enrollments')
  async createEnrollment(@Body() body: {
    clientId: string;
    userId: string;
    programType?: ProgramType;
    totalEnrolledDebt: number;
    estimatedSettlementAmount: number;
    monthlyProgramPayment: number;
    programLengthMonths: number;
    settlementFeePercent?: number;
    enrolledDebtIds?: string[];
    groupId?: string;
    assignedTo?: string;
    notes?: string;
  }) {
    return this.crmService.createEnrollment(body);
  }

  @Post('enrollments/:id/activate')
  async activateEnrollment(@Param('id') id: string) {
    return this.crmService.activateEnrollment(id);
  }

  @Post('enrollments/:id/complete')
  async completeEnrollment(@Param('id') id: string) {
    return this.crmService.completeEnrollment(id);
  }

  @Post('enrollments/:id/cancel')
  async cancelEnrollment(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.crmService.cancelEnrollment(id, reason);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Settlements (Negotiation Pipeline)
  // ===========================================================================

  @Get('settlements')
  async listSettlements(
    @Query('enrollmentId') enrollmentId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: SettlementStatus,
    @Query('groupId') groupId?: string,
  ) {
    return this.crmService.listSettlements(enrollmentId, clientId, status, groupId);
  }

  @Get('settlements/:id')
  async getSettlement(@Param('id') id: string) {
    return this.crmService.getSettlement(id);
  }

  @Post('settlements')
  async createSettlement(@Body() body: {
    enrollmentId: string;
    clientId: string;
    creditorId: string;
    debtId?: string;
    accountNumber?: string;
    originalBalance: number;
    currentBalance: number;
    offeredAmount: number;
    groupId?: string;
    assignedTo?: string;
  }) {
    return this.crmService.createSettlement(body);
  }

  @Post('settlements/:id/offer')
  async makeOffer(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('by') by: string,
    @Body('notes') notes?: string,
  ) {
    return this.crmService.makeOffer(id, amount, by, notes);
  }

  @Post('settlements/:id/counter')
  async counterOffer(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('by') by: string,
    @Body('notes') notes?: string,
  ) {
    return this.crmService.counterOffer(id, amount, by, notes);
  }

  @Post('settlements/:id/accept')
  async acceptSettlement(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('by') by: string,
    @Body('notes') notes?: string,
  ) {
    return this.crmService.acceptSettlement(id, amount, by, notes);
  }

  @Post('settlements/:id/approve')
  async approveSettlement(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    return this.crmService.approveSettlement(id, approvedBy);
  }

  @Post('settlements/:id/fund')
  async fundSettlement(
    @Param('id') id: string,
    @Body('fundedBy') fundedBy: string,
  ) {
    return this.crmService.fundSettlement(id, fundedBy);
  }

  @Post('settlements/:id/reject')
  async rejectSettlement(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('by') by: string,
  ) {
    return this.crmService.rejectSettlement(id, reason, by);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Trust Accounts
  // ===========================================================================

  @Get('trust-accounts/:clientId')
  async getTrustAccount(@Param('clientId') clientId: string) {
    return this.crmService.getTrustAccount(clientId);
  }

  @Get('trust-accounts/:clientId/balance')
  async getTrustAccountBalance(@Param('clientId') clientId: string) {
    return this.crmService.getTrustAccountBalance(clientId);
  }

  @Post('trust-accounts')
  async createTrustAccount(@Body() body: {
    clientId: string;
    enrollmentId: string;
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    groupId?: string;
  }) {
    return this.crmService.createTrustAccount(body);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Payments
  // ===========================================================================

  @Get('payments')
  async listPayments(
    @Query('clientId') clientId?: string,
    @Query('trustAccountId') trustAccountId?: string,
    @Query('settlementId') settlementId?: string,
    @Query('status') status?: SettlementPaymentStatus,
    @Query('groupId') groupId?: string,
  ) {
    return this.crmService.listPayments(clientId, trustAccountId, settlementId, status, groupId);
  }

  @Post('payments')
  async createPayment(@Body() body: {
    trustAccountId: string;
    clientId: string;
    settlementId?: string;
    creditorId?: string;
    paymentType: SettlementPaymentType;
    amount: number;
    scheduledDate?: Date;
    paymentMethod?: string;
    notes?: string;
    groupId?: string;
  }) {
    return this.crmService.createPayment(body);
  }

  @Post('payments/:id/process')
  async processPayment(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    return this.crmService.processPayment(id, approvedBy);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Dashboard
  // ===========================================================================

  @Get('settlement-dashboard')
  async getSettlementDashboard(@Query('groupId') groupId?: string) {
    return this.crmService.getSettlementDashboard(groupId);
  }
}
