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
      probability: input.probability ?? 0,
      expectedCloseDate: input.expectedCloseDate,
      assignedTo: input.assignedTo,
      userId: input.userId,
      groupId: input.groupId,
      tags: input.tags ?? [],
      status: CrmDealStatus.ACTIVE,
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
}
