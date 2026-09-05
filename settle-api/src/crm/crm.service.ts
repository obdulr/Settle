import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not, Between } from 'typeorm';
import {
  CrmLead,
  CrmLeadSource,
  CrmLeadStatus,
  CrmLeadGrade,
} from '../entities/crm-lead.entity';
import { CrmDeal, CrmDealStage, CrmDealStatus } from '../entities/crm-deal.entity';
import { CrmClient, CrmClientStatus, CrmLifecycleStage } from '../entities/crm-client.entity';
import { Creditor, CreditorType } from '../entities/creditor.entity';
import {
  ClientEnrollment,
  EnrollmentStatus,
  ProgramType,
} from '../entities/client-enrollment.entity';
import {
  Settlement,
  SettlementStatus,
} from '../entities/settlement.entity';
import { TrustAccount, TrustAccountStatus } from '../entities/trust-account.entity';
import {
  SettlementPayment,
  SettlementPaymentType,
  SettlementPaymentStatus,
} from '../entities/settlement-payment.entity';

export interface CrmData {
  leads: CrmLead[];
  clients: CrmClient[];
  sales: CrmDeal[];
  pipeline: Record<string, number>;
}

export interface GroupCrmSummary {
  groupId: string;
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  activeDeals: number;
  projectedRevenue: number;
  closedRevenue: number;
  totalClients: number;
  conversionRate: number;
  topLeads: CrmLead[];
  pipelineByStage: Record<string, number>;
}

export interface CreateCrmLeadInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: CrmLeadSource;
  userId: string;
  groupId?: string;
  consumerLeadId?: string;
  score?: number;
  aiScore?: number;
}

export interface UpdateCrmLeadInput {
  status?: CrmLeadStatus;
  score?: number;
  aiScore?: number;
  aiGrade?: CrmLeadGrade;
  aiInsights?: string[];
  aiRecommendedActions?: string[];
  emailOpens?: number;
  emailClicks?: number;
  websiteVisits?: number;
  pricingPageVisits?: number;
  contentDownloads?: number;
  formSubmissions?: number;
  demoRequests?: number;
  webinarAttendance?: boolean;
}

export interface CreateCrmDealInput {
  title: string;
  description?: string;
  clientId: string;
  contactId?: string;
  stage: CrmDealStage;
  value: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: Date;
  assignedTo: string;
  userId: string;
  groupId?: string;
  tags?: string[];
  status?: CrmDealStatus;
  wonDate?: Date;
}

export interface CreateCrmClientInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: string;
  userId: string;
  groupId?: string;
  assignedTo?: string;
}

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    @InjectRepository(CrmLead)
    private readonly leadRepository: Repository<CrmLead>,
    @InjectRepository(CrmDeal)
    private readonly dealRepository: Repository<CrmDeal>,
    @InjectRepository(CrmClient)
    private readonly clientRepository: Repository<CrmClient>,
    @InjectRepository(Creditor)
    private readonly creditorRepository: Repository<Creditor>,
    @InjectRepository(ClientEnrollment)
    private readonly enrollmentRepository: Repository<ClientEnrollment>,
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(TrustAccount)
    private readonly trustAccountRepository: Repository<TrustAccount>,
    @InjectRepository(SettlementPayment)
    private readonly paymentRepository: Repository<SettlementPayment>,
  ) {}

  // ---------- Lead operations ----------

  async createLead(input: CreateCrmLeadInput): Promise<CrmLead> {
    const lead = this.leadRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      company: input.company,
      jobTitle: input.jobTitle,
      source: input.source,
      status: CrmLeadStatus.NEW,
      userId: input.userId,
      groupId: input.groupId,
      consumerLeadId: input.consumerLeadId,
      score: input.score ?? 0,
      aiScore: input.aiScore,
      lastScoredAt: input.aiScore ? new Date() : undefined,
    });
    const saved = await this.leadRepository.save(lead);
    this.logger.log(`Created CRM lead ${saved.id} for user ${input.userId} (group=${input.groupId ?? 'platform'})`);
    return saved;
  }

  async getLead(leadId: string): Promise<CrmLead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException(`CRM lead ${leadId} not found`);
    return lead;
  }

  async updateLead(leadId: string, input: UpdateCrmLeadInput): Promise<CrmLead> {
    const lead = await this.getLead(leadId);
    Object.assign(lead, input);
    return this.leadRepository.save(lead);
  }

  async listLeads(userId?: string, groupId?: string): Promise<CrmLead[]> {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (groupId) where.groupId = groupId;
    return this.leadRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async listLeadsByStatus(status: CrmLeadStatus, groupId?: string): Promise<CrmLead[]> {
    const where: Record<string, unknown> = { status };
    if (groupId) where.groupId = groupId;
    return this.leadRepository.find({ where, order: { score: 'DESC' }, take: 100 });
  }

  async advanceLeadStage(leadId: string): Promise<CrmLead> {
    const lead = await this.getLead(leadId);
    const order: CrmLeadStatus[] = [
      CrmLeadStatus.NEW,
      CrmLeadStatus.CONTACTED,
      CrmLeadStatus.QUALIFIED,
      CrmLeadStatus.PROPOSAL,
      CrmLeadStatus.NEGOTIATION,
      CrmLeadStatus.CLOSED_WON,
    ];
    const idx = order.indexOf(lead.status);
    if (idx >= 0 && idx < order.length - 1) {
      lead.status = order[idx + 1];
      this.logger.log(`Advanced CRM lead ${leadId} to ${lead.status}`);
    }
    return this.leadRepository.save(lead);
  }

  async loseLead(leadId: string, reason?: string): Promise<CrmLead> {
    const lead = await this.getLead(leadId);
    lead.status = CrmLeadStatus.CLOSED_LOST;
    if (reason) {
      lead.aiInsights = [...(lead.aiInsights ?? []), `Lost reason: ${reason}`];
    }
    return this.leadRepository.save(lead);
  }

  async nurtureLead(leadId: string): Promise<CrmLead> {
    const lead = await this.getLead(leadId);
    lead.status = CrmLeadStatus.NURTURING;
    return this.leadRepository.save(lead);
  }

  // ---------- Deal operations ----------

  async createDeal(input: CreateCrmDealInput): Promise<CrmDeal> {
    const deal = this.dealRepository.create({
      title: input.title,
      description: input.description,
      clientId: input.clientId,
      contactId: input.contactId,
      stage: input.stage,
      value: input.value,
      currency: input.currency ?? 'USD',
      probability: input.probability ?? (input.status === CrmDealStatus.WON ? 100 : 0),
      expectedCloseDate: input.expectedCloseDate,
      assignedTo: input.assignedTo,
      userId: input.userId,
      groupId: input.groupId,
      tags: input.tags ?? [],
      status: input.status ?? CrmDealStatus.ACTIVE,
      wonDate: input.wonDate,
    });
    const saved = await this.dealRepository.save(deal);
    this.logger.log(`Created CRM deal ${saved.id} for user ${input.userId} (group=${input.groupId ?? 'platform'})`);
    return saved;
  }

  async getDeal(dealId: string): Promise<CrmDeal> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException(`CRM deal ${dealId} not found`);
    return deal;
  }

  async updateDealStage(dealId: string, stage: CrmDealStage): Promise<CrmDeal> {
    const deal = await this.getDeal(dealId);
    deal.stage = stage;
    if (stage === CrmDealStage.PURCHASE) {
      deal.status = CrmDealStatus.WON;
      deal.wonDate = new Date();
      deal.probability = 100;
    }
    return this.dealRepository.save(deal);
  }

  async loseDeal(dealId: string, reason?: string): Promise<CrmDeal> {
    const deal = await this.getDeal(dealId);
    deal.status = CrmDealStatus.LOST;
    deal.lostDate = new Date();
    if (reason) deal.lostReason = reason;
    return this.dealRepository.save(deal);
  }

  async listDeals(userId?: string, groupId?: string, status?: CrmDealStatus): Promise<CrmDeal[]> {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (groupId) where.groupId = groupId;
    if (status) where.status = status;
    return this.dealRepository.find({ where, order: { createdAt: 'DESC' }, take: 200 });
  }

  // ---------- Client operations ----------

  async listClients(userId?: string, groupId?: string): Promise<CrmClient[]> {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (groupId) where.groupId = groupId;
    return this.clientRepository.find({ where, order: { createdAt: 'DESC' }, take: 200 });
  }

  async findClientByGroupId(groupId: string): Promise<CrmClient | null> {
    return this.clientRepository.findOne({ where: { groupId } });
  }

  async createClient(input: CreateCrmClientInput): Promise<CrmClient> {
    const client = this.clientRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      company: input.company,
      jobTitle: input.jobTitle,
      status: CrmClientStatus.LEAD,
      lifecycleStage: CrmLifecycleStage.AWARENESS,
      source: input.source,
      tags: [],
      totalValue: 0,
      userId: input.userId,
      groupId: input.groupId,
      assignedTo: input.assignedTo,
    });
    const saved = await this.clientRepository.save(client);
    this.logger.log(`Created CRM client ${saved.id} (group=${input.groupId ?? 'platform'})`);
    return saved;
  }

  async promoteLeadToClient(leadId: string): Promise<CrmClient> {
    const lead = await this.getLead(leadId);
    const client = this.clientRepository.create({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      jobTitle: lead.jobTitle,
      status: CrmClientStatus.ACTIVE,
      lifecycleStage: CrmLifecycleStage.DECISION,
      source: lead.source,
      tags: [`from-lead:${lead.id}`],
      totalValue: 0,
      userId: lead.userId,
      groupId: lead.groupId,
    });
    const saved = await this.clientRepository.save(client);
    lead.status = CrmLeadStatus.CLOSED_WON;
    await this.leadRepository.save(lead);
    this.logger.log(`Promoted CRM lead ${leadId} to client ${saved.id}`);
    return saved;
  }

  // ---------- Pipeline aggregation ----------

  async getPipeline(userId?: string, groupId?: string): Promise<Record<string, number>> {
    const deals = await this.listDeals(userId, groupId, CrmDealStatus.ACTIVE);
    const pipeline: Record<string, number> = {};
    for (const stage of Object.values(CrmDealStage)) {
      const stageDeals = deals.filter((d) => d.stage === stage);
      pipeline[stage] = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);
    }
    return pipeline;
  }

  // ---------- Dashboard data ----------

  async getCrmData(userId?: string): Promise<CrmData> {
    try {
      const [leads, clients, sales] = await Promise.all([
        this.listLeads(userId),
        this.listClients(userId),
        this.listDeals(userId, undefined, CrmDealStatus.WON),
      ]);
      const pipeline = await this.getPipeline(userId);
      return { leads, clients, sales, pipeline };
    } catch (error) {
      this.logger.error('Failed to load CRM data', error);
      return { leads: [], clients: [], sales: [], pipeline: {} };
    }
  }

  // ---------- Per-group CRM summary ----------

  async getGroupCrmSummary(groupId: string): Promise<GroupCrmSummary> {
    const [leads, deals, clients] = await Promise.all([
      this.listLeads(undefined, groupId),
      this.listDeals(undefined, groupId),
      this.listClients(undefined, groupId),
    ]);

    const newLeads = leads.filter((l) => l.status === CrmLeadStatus.NEW).length;
    const qualifiedLeads = leads.filter(
      (l) => l.status === CrmLeadStatus.QUALIFIED || l.status === CrmLeadStatus.PROPOSAL || l.status === CrmLeadStatus.NEGOTIATION,
    ).length;
    const activeDeals = deals.filter((d) => d.status === CrmDealStatus.ACTIVE);
    const wonDeals = deals.filter((d) => d.status === CrmDealStatus.WON);
    const projectedRevenue = activeDeals.reduce(
      (sum, d) => sum + Number(d.value) * (Number(d.probability) / 100),
      0,
    );
    const closedRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const conversionRate = leads.length > 0 ? (wonDeals.length / leads.length) * 100 : 0;

    const pipelineByStage: Record<string, number> = {};
    for (const stage of Object.values(CrmDealStage)) {
      pipelineByStage[stage] = activeDeals
        .filter((d) => d.stage === stage)
        .reduce((sum, d) => sum + Number(d.value), 0);
    }

    const topLeads = [...leads]
      .sort((a, b) => (b.aiScore ?? b.score) - (a.aiScore ?? a.score))
      .slice(0, 10);

    return {
      groupId,
      totalLeads: leads.length,
      newLeads,
      qualifiedLeads,
      activeDeals: activeDeals.length,
      projectedRevenue,
      closedRevenue,
      totalClients: clients.length,
      conversionRate,
      topLeads,
      pipelineByStage,
    };
  }

  // ---------- Engagement signal ingestion ----------

  async incrementEngagement(
    leadId: string,
    signal:
      | 'email_open'
      | 'email_click'
      | 'website_visit'
      | 'pricing_page_visit'
      | 'content_download'
      | 'form_submission'
      | 'demo_request'
      | 'webinar_attendance',
  ): Promise<CrmLead | null> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) return null;

    switch (signal) {
      case 'email_open':
        lead.emailOpens = (lead.emailOpens ?? 0) + 1;
        break;
      case 'email_click':
        lead.emailClicks = (lead.emailClicks ?? 0) + 1;
        break;
      case 'website_visit':
        lead.websiteVisits = (lead.websiteVisits ?? 0) + 1;
        break;
      case 'pricing_page_visit':
        lead.pricingPageVisits = (lead.pricingPageVisits ?? 0) + 1;
        break;
      case 'content_download':
        lead.contentDownloads = (lead.contentDownloads ?? 0) + 1;
        break;
      case 'form_submission':
        lead.formSubmissions = (lead.formSubmissions ?? 0) + 1;
        break;
      case 'demo_request':
        lead.demoRequests = (lead.demoRequests ?? 0) + 1;
        break;
      case 'webinar_attendance':
        lead.webinarAttendance = true;
        break;
    }
    lead.lastScoredAt = new Date();
    return this.leadRepository.save(lead);
  }

  async findLeadByEmail(email: string, groupId?: string): Promise<CrmLead | null> {
    const where: Record<string, unknown> = { email };
    if (groupId) where.groupId = groupId;
    else where.groupId = IsNull();
    return this.leadRepository.findOne({ where });
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Creditor Management
  // ===========================================================================

  async listCreditors(groupId?: string, type?: CreditorType): Promise<Creditor[]> {
    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;
    if (type) where.type = type;
    return this.creditorRepository.find({ where, order: { name: 'ASC' } });
  }

  async getCreditor(creditorId: string): Promise<Creditor> {
    const creditor = await this.creditorRepository.findOne({ where: { id: creditorId } });
    if (!creditor) throw new NotFoundException(`Creditor ${creditorId} not found`);
    return creditor;
  }

  async createCreditor(input: Partial<Creditor>): Promise<Creditor> {
    const creditor = this.creditorRepository.create(input);
    const saved = await this.creditorRepository.save(creditor);
    this.logger.log(`Created creditor ${saved.id} — ${saved.name}`);
    return saved;
  }

  async updateCreditor(creditorId: string, updates: Partial<Creditor>): Promise<Creditor> {
    const creditor = await this.getCreditor(creditorId);
    Object.assign(creditor, updates);
    return this.creditorRepository.save(creditor);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Client Enrollment
  // ===========================================================================

  async listEnrollments(
    clientId?: string,
    status?: EnrollmentStatus,
    groupId?: string,
  ): Promise<ClientEnrollment[]> {
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (groupId) where.groupId = groupId;
    return this.enrollmentRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async getEnrollment(enrollmentId: string): Promise<ClientEnrollment> {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    return enrollment;
  }

  async createEnrollment(input: {
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
  }): Promise<ClientEnrollment> {
    const totalFees =
      Number(input.estimatedSettlementAmount) *
      (Number(input.settlementFeePercent ?? 20) / 100);

    const enrollment = this.enrollmentRepository.create({
      clientId: input.clientId,
      userId: input.userId,
      programType: input.programType ?? ProgramType.DEBT_SETTLEMENT,
      status: EnrollmentStatus.PENDING,
      totalEnrolledDebt: input.totalEnrolledDebt,
      estimatedSettlementAmount: input.estimatedSettlementAmount,
      monthlyProgramPayment: input.monthlyProgramPayment,
      programLengthMonths: input.programLengthMonths,
      settlementFeePercent: input.settlementFeePercent ?? 20,
      totalFeesEstimated: totalFees,
      enrolledDebtIds: input.enrolledDebtIds ?? [],
      totalAccountsEnrolled: input.enrolledDebtIds?.length ?? 0,
      groupId: input.groupId,
      assignedTo: input.assignedTo,
      notes: input.notes,
    });

    const saved = await this.enrollmentRepository.save(enrollment);
    this.logger.log(`Created enrollment ${saved.id} for client ${input.clientId}`);
    return saved;
  }

  async activateEnrollment(enrollmentId: string): Promise<ClientEnrollment> {
    const enrollment = await this.getEnrollment(enrollmentId);
    enrollment.status = EnrollmentStatus.ACTIVE;
    enrollment.enrollmentDate = new Date();
    const completion = new Date();
    completion.setMonth(completion.getMonth() + enrollment.programLengthMonths);
    enrollment.expectedCompletionDate = completion;
    this.logger.log(`Activated enrollment ${enrollmentId}`);
    return this.enrollmentRepository.save(enrollment);
  }

  async completeEnrollment(enrollmentId: string): Promise<ClientEnrollment> {
    const enrollment = await this.getEnrollment(enrollmentId);
    enrollment.status = EnrollmentStatus.COMPLETED;
    enrollment.actualCompletionDate = new Date();
    this.logger.log(`Completed enrollment ${enrollmentId}`);
    return this.enrollmentRepository.save(enrollment);
  }

  async cancelEnrollment(enrollmentId: string, reason?: string): Promise<ClientEnrollment> {
    const enrollment = await this.getEnrollment(enrollmentId);
    enrollment.status = EnrollmentStatus.CANCELLED;
    if (reason) enrollment.notes = `${enrollment.notes ?? ''}\nCancelled: ${reason}`.trim();
    return this.enrollmentRepository.save(enrollment);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Settlement Negotiations
  // ===========================================================================

  async listSettlements(
    enrollmentId?: string,
    clientId?: string,
    status?: SettlementStatus,
    groupId?: string,
  ): Promise<Settlement[]> {
    const where: Record<string, unknown> = {};
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (groupId) where.groupId = groupId;
    return this.settlementRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async getSettlement(settlementId: string): Promise<Settlement> {
    const settlement = await this.settlementRepository.findOne({ where: { id: settlementId } });
    if (!settlement) throw new NotFoundException(`Settlement ${settlementId} not found`);
    return settlement;
  }

  async createSettlement(input: {
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
  }): Promise<Settlement> {
    const settlementPercent =
      Number(input.currentBalance) > 0
        ? (Number(input.offeredAmount) / Number(input.currentBalance)) * 100
        : 0;

    const settlement = this.settlementRepository.create({
      enrollmentId: input.enrollmentId,
      clientId: input.clientId,
      creditorId: input.creditorId,
      debtId: input.debtId,
      accountNumber: input.accountNumber,
      originalBalance: input.originalBalance,
      currentBalance: input.currentBalance,
      offeredAmount: input.offeredAmount,
      settlementPercent: Math.round(settlementPercent * 100) / 100,
      status: SettlementStatus.PENDING,
      negotiationHistory: [{
        date: new Date(),
        action: 'settlement_created',
        amount: Number(input.offeredAmount),
        by: input.assignedTo ?? 'system',
        notes: 'Initial settlement offer prepared',
      }],
      groupId: input.groupId,
      assignedTo: input.assignedTo,
    });

    const saved = await this.settlementRepository.save(settlement);
    this.logger.log(`Created settlement ${saved.id} for client ${input.clientId}`);
    return saved;
  }

  async makeOffer(settlementId: string, amount: number, by: string, notes?: string): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);
    settlement.offeredAmount = amount;
    settlement.offerDate = new Date();
    settlement.status = SettlementStatus.OFFER_MADE;
    settlement.settlementPercent =
      Number(settlement.currentBalance) > 0
        ? Math.round((amount / Number(settlement.currentBalance)) * 10000) / 100
        : 0;
    settlement.negotiationHistory = [
      ...(settlement.negotiationHistory ?? []),
      { date: new Date(), action: 'offer_made', amount, by, notes },
    ];
    return this.settlementRepository.save(settlement);
  }

  async counterOffer(settlementId: string, amount: number, by: string, notes?: string): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);
    settlement.status = SettlementStatus.COUNTER_OFFER;
    settlement.negotiationHistory = [
      ...(settlement.negotiationHistory ?? []),
      { date: new Date(), action: 'counter_offer', amount, by, notes },
    ];
    return this.settlementRepository.save(settlement);
  }

  async acceptSettlement(settlementId: string, amount: number, by: string, notes?: string): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);
    settlement.settlementAmount = amount;
    settlement.acceptanceDate = new Date();
    settlement.status = SettlementStatus.ACCEPTED;
    settlement.settlementPercent =
      Number(settlement.currentBalance) > 0
        ? Math.round((amount / Number(settlement.currentBalance)) * 10000) / 100
        : 0;
    settlement.savingsAmount = Number(settlement.currentBalance) - amount;
    settlement.savingsPercent =
      Number(settlement.currentBalance) > 0
        ? Math.round((settlement.savingsAmount / Number(settlement.currentBalance)) * 10000) / 100
        : 0;
    settlement.negotiationHistory = [
      ...(settlement.negotiationHistory ?? []),
      { date: new Date(), action: 'accepted', amount, by, notes },
    ];
    this.logger.log(`Settlement ${settlementId} accepted at ${amount} (${settlement.settlementPercent}% of balance)`);
    return this.settlementRepository.save(settlement);
  }

  async approveSettlement(settlementId: string, approvedBy: string): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);
    if (settlement.status !== SettlementStatus.ACCEPTED) {
      throw new Error('Settlement must be in ACCEPTED status before approval');
    }
    settlement.status = SettlementStatus.APPROVED;
    settlement.negotiationHistory = [
      ...(settlement.negotiationHistory ?? []),
      { date: new Date(), action: 'approved', by: approvedBy },
    ];
    return this.settlementRepository.save(settlement);
  }

  async fundSettlement(settlementId: string, fundedBy: string): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);
    if (settlement.status !== SettlementStatus.APPROVED) {
      throw new Error('Settlement must be APPROVED before funding');
    }
    settlement.status = SettlementStatus.FUNDED;
    settlement.fundedDate = new Date();
    settlement.daysToSettle = settlement.offerDate
      ? Math.round((Date.now() - settlement.offerDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    settlement.negotiationHistory = [
      ...(settlement.negotiationHistory ?? []),
      { date: new Date(), action: 'funded', by: fundedBy },
    ];

    // Update enrollment totals
    const enrollment = await this.getEnrollment(settlement.enrollmentId);
    enrollment.totalSettledAmount = Number(enrollment.totalSettledAmount) + Number(settlement.settlementAmount);
    enrollment.totalSavedAmount = Number(enrollment.totalSavedAmount) + Number(settlement.savingsAmount ?? 0);
    enrollment.totalAccountsSettled += 1;
    if (enrollment.totalAccountsSettled >= enrollment.totalAccountsEnrolled) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.actualCompletionDate = new Date();
    }
    await this.enrollmentRepository.save(enrollment);

    return this.settlementRepository.save(settlement);
  }

  async rejectSettlement(settlementId: string, reason: string, by: string): Promise<Settlement> {
    const settlement = await this.getSettlement(settlementId);
    settlement.status = SettlementStatus.REJECTED;
    settlement.negotiationHistory = [
      ...(settlement.negotiationHistory ?? []),
      { date: new Date(), action: 'rejected', by, notes: reason },
    ];
    return this.settlementRepository.save(settlement);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Trust Account Management
  // ===========================================================================

  async getTrustAccount(clientId: string): Promise<TrustAccount | null> {
    return this.trustAccountRepository.findOne({ where: { clientId } });
  }

  async createTrustAccount(input: {
    clientId: string;
    enrollmentId: string;
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    groupId?: string;
  }): Promise<TrustAccount> {
    const existing = await this.getTrustAccount(input.clientId);
    if (existing) throw new Error(`Trust account already exists for client ${input.clientId}`);

    const account = this.trustAccountRepository.create({
      clientId: input.clientId,
      enrollmentId: input.enrollmentId,
      accountNumber: input.accountNumber,
      routingNumber: input.routingNumber,
      bankName: input.bankName,
      status: TrustAccountStatus.ACTIVE,
      openedDate: new Date(),
      groupId: input.groupId,
    });
    const saved = await this.trustAccountRepository.save(account);
    this.logger.log(`Created trust account ${saved.id} for client ${input.clientId}`);
    return saved;
  }

  async getTrustAccountBalance(clientId: string): Promise<{
    currentBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalFeesCollected: number;
    totalSettlementsPaid: number;
  }> {
    const account = await this.getTrustAccount(clientId);
    if (!account) {
      return {
        currentBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalFeesCollected: 0,
        totalSettlementsPaid: 0,
      };
    }
    return {
      currentBalance: Number(account.currentBalance),
      totalDeposited: Number(account.totalDeposited),
      totalWithdrawn: Number(account.totalWithdrawn),
      totalFeesCollected: Number(account.totalFeesCollected),
      totalSettlementsPaid: Number(account.totalSettlementsPaid),
    };
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Settlement Payments
  // ===========================================================================

  async listPayments(
    clientId?: string,
    trustAccountId?: string,
    settlementId?: string,
    status?: SettlementPaymentStatus,
    groupId?: string,
  ): Promise<SettlementPayment[]> {
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (trustAccountId) where.trustAccountId = trustAccountId;
    if (settlementId) where.settlementId = settlementId;
    if (status) where.status = status;
    if (groupId) where.groupId = groupId;
    return this.paymentRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async createPayment(input: {
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
  }): Promise<SettlementPayment> {
    const payment = this.paymentRepository.create({
      trustAccountId: input.trustAccountId,
      clientId: input.clientId,
      settlementId: input.settlementId,
      creditorId: input.creditorId,
      paymentType: input.paymentType,
      amount: input.amount,
      scheduledDate: input.scheduledDate,
      paymentMethod: input.paymentMethod,
      status: input.scheduledDate ? SettlementPaymentStatus.SCHEDULED : SettlementPaymentStatus.PENDING,
      notes: input.notes,
      groupId: input.groupId,
    });
    const saved = await this.paymentRepository.save(payment);
    this.logger.log(`Created payment ${saved.id} — type=${input.paymentType}, amount=${input.amount}`);
    return saved;
  }

  async processPayment(paymentId: string, approvedBy: string): Promise<SettlementPayment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    payment.status = SettlementPaymentStatus.PROCESSED;
    payment.processedDate = new Date();
    payment.approvedBy = approvedBy;
    payment.approvedAt = new Date();

    // Update trust account balances
    const account = await this.trustAccountRepository.findOne({ where: { id: payment.trustAccountId } });
    if (account) {
      const amount = Number(payment.amount);
      switch (payment.paymentType) {
        case SettlementPaymentType.DEPOSIT:
          account.currentBalance = Number(account.currentBalance) + amount;
          account.totalDeposited = Number(account.totalDeposited) + amount;
          break;
        case SettlementPaymentType.SETTLEMENT_PAYMENT:
          account.currentBalance = Number(account.currentBalance) - amount;
          account.totalSettlementsPaid = Number(account.totalSettlementsPaid) + amount;
          account.totalWithdrawn = Number(account.totalWithdrawn) + amount;
          break;
        case SettlementPaymentType.FEE_PAYMENT:
          account.currentBalance = Number(account.currentBalance) - amount;
          account.totalFeesCollected = Number(account.totalFeesCollected) + amount;
          account.totalWithdrawn = Number(account.totalWithdrawn) + amount;
          break;
        case SettlementPaymentType.WITHDRAWAL:
          account.currentBalance = Number(account.currentBalance) - amount;
          account.totalWithdrawn = Number(account.totalWithdrawn) + amount;
          break;
        case SettlementPaymentType.REFUND:
          account.currentBalance = Number(account.currentBalance) + amount;
          break;
      }
      await this.trustAccountRepository.save(account);
    }

    this.logger.log(`Processed payment ${paymentId} — ${payment.paymentType}, $${payment.amount}`);
    return this.paymentRepository.save(payment);
  }

  // ===========================================================================
  // DEBT SETTLEMENT — Dashboard Analytics
  // ===========================================================================

  async getSettlementDashboard(groupId?: string): Promise<{
    totalEnrolledDebt: number;
 totalClients: number;
    activeEnrollments: number;
    completedEnrollments: number;
    totalSettledAmount: number;
    totalSavedAmount: number;
    averageSavingsPercent: number;
    activeSettlements: number;
    pendingOffers: number;
    trustAccountBalance: number;
    totalFeesCollected: number;
    recentSettlements: Settlement[];
  }> {
    const enrollmentWhere: Record<string, unknown> = {};
    if (groupId) enrollmentWhere.groupId = groupId;

    const enrollments = await this.enrollmentRepository.find({ where: enrollmentWhere });
    const activeEnrollments = enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE);
    const completedEnrollments = enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED);
    const totalEnrolledDebt = enrollments.reduce((s, e) => s + Number(e.totalEnrolledDebt), 0);
    const totalSettledAmount = enrollments.reduce((s, e) => s + Number(e.totalSettledAmount), 0);
    const totalSavedAmount = enrollments.reduce((s, e) => s + Number(e.totalSavedAmount), 0);

    const settlementWhere: Record<string, unknown> = {};
    if (groupId) settlementWhere.groupId = groupId;
    const settlements = await this.settlementRepository.find({ where: settlementWhere, order: { createdAt: 'DESC' }, take: 10 });
    const allSettlements = await this.settlementRepository.find({ where: settlementWhere });
    const activeSettlements = allSettlements.filter(
      (s) => ![SettlementStatus.COMPLETED, SettlementStatus.CANCELLED, SettlementStatus.REJECTED].includes(s.status),
    ).length;
    const pendingOffers = allSettlements.filter(
      (s) => s.status === SettlementStatus.OFFER_MADE || s.status === SettlementStatus.COUNTER_OFFER,
    ).length;

    const settledWithSavings = allSettlements.filter((s) => s.savingsPercent != null && s.status === SettlementStatus.COMPLETED);
    const averageSavingsPercent =
      settledWithSavings.length > 0
        ? settledWithSavings.reduce((s, r) => s + Number(r.savingsPercent), 0) / settledWithSavings.length
        : 0;

    const trustWhere: Record<string, unknown> = {};
    if (groupId) trustWhere.groupId = groupId;
    const trustAccounts = await this.trustAccountRepository.find({ where: trustWhere });
    const trustAccountBalance = trustAccounts.reduce((s, a) => s + Number(a.currentBalance), 0);
    const totalFeesCollected = trustAccounts.reduce((s, a) => s + Number(a.totalFeesCollected), 0);

    return {
      totalEnrolledDebt,
      totalClients: new Set(enrollments.map((e) => e.clientId)).size,
      activeEnrollments: activeEnrollments.length,
      completedEnrollments: completedEnrollments.length,
      totalSettledAmount,
      totalSavedAmount,
      averageSavingsPercent: Math.round(averageSavingsPercent * 10) / 10,
      activeSettlements,
      pendingOffers,
      trustAccountBalance,
      totalFeesCollected,
      recentSettlements: settlements,
    };
  }
}
