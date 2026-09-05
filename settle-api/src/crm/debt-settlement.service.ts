import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, LessThan, MoreThan } from 'typeorm';
import { LeadRoutingRule, RoutingStrategy } from '../entities/lead-routing-rule.entity';
import { LeadAssignment, AssignmentStatus } from '../entities/lead-assignment.entity';
import { DncEntry } from '../entities/dnc-entry.entity';
import { ConsentLog, ConsentType, ConsentMethod } from '../entities/consent-log.entity';
import {
  CommunicationLog,
  CommunicationType,
  CommunicationDirection,
  CommunicationStatus,
} from '../entities/communication-log.entity';
import { CrmTask, TaskType, TaskPriority, TaskStatus } from '../entities/crm-task.entity';
import { CrmLead, CrmLeadStatus } from '../entities/crm-lead.entity';
import { Lead } from '../entities/lead.entity';

@Injectable()
export class DebtSettlementService {
  private readonly logger = new Logger(DebtSettlementService.name);

  constructor(
    @InjectRepository(LeadRoutingRule)
    private readonly routingRuleRepository: Repository<LeadRoutingRule>,
    @InjectRepository(LeadAssignment)
    private readonly assignmentRepository: Repository<LeadAssignment>,
    @InjectRepository(DncEntry)
    private readonly dncRepository: Repository<DncEntry>,
    @InjectRepository(ConsentLog)
    private readonly consentRepository: Repository<ConsentLog>,
    @InjectRepository(CommunicationLog)
    private readonly communicationRepository: Repository<CommunicationLog>,
    @InjectRepository(CrmTask)
    private readonly taskRepository: Repository<CrmTask>,
    @InjectRepository(CrmLead)
    private readonly crmLeadRepository: Repository<CrmLead>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  // ===========================================================================
  // LEAD ROUTING & DISTRIBUTION
  // ===========================================================================

  async listRoutingRules(groupId?: string): Promise<LeadRoutingRule[]> {
    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;
    return this.routingRuleRepository.find({ where, order: { priority: 'ASC' } });
  }

  async createRoutingRule(input: Partial<LeadRoutingRule>): Promise<LeadRoutingRule> {
    const rule = this.routingRuleRepository.create(input);
    const saved = await this.routingRuleRepository.save(rule);
    this.logger.log(`Created routing rule ${saved.id} — ${saved.name}`);
    return saved;
  }

  async updateRoutingRule(ruleId: string, updates: Partial<LeadRoutingRule>): Promise<LeadRoutingRule> {
    const rule = await this.routingRuleRepository.findOne({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException(`Routing rule ${ruleId} not found`);
    Object.assign(rule, updates);
    return this.routingRuleRepository.save(rule);
  }

  async routeLead(
    leadId: string,
    debtAmount?: number,
    state?: string,
    debtTypes?: string[],
    groupId?: string,
  ): Promise<LeadAssignment> {
    const rules = await this.listRoutingRules(groupId);
    const activeRules = rules.filter((r) => r.isActive);

    let matchedRule: LeadRoutingRule | undefined;
    for (const rule of activeRules) {
      if (rule.minDebtAmount && debtAmount && Number(debtAmount) < Number(rule.minDebtAmount)) continue;
      if (rule.maxDebtAmount && debtAmount && Number(debtAmount) > Number(rule.maxDebtAmount)) continue;
      if (rule.states?.length && state && !rule.states.includes(state)) continue;
      if (rule.debtTypes?.length && debtTypes && !debtTypes.some((t) => rule.debtTypes.includes(t))) continue;
      matchedRule = rule;
      break;
    }

    let assignedTo = 'unassigned';
    if (matchedRule) {
      const agents = matchedRule.agentUserIds;
      if (agents.length > 0) {
        if (matchedRule.routingStrategy === RoutingStrategy.ROUND_ROBIN) {
          assignedTo = await this.getNextRoundRobinAgent(agents, groupId);
        } else if (matchedRule.routingStrategy === RoutingStrategy.SHARK_TANK) {
          assignedTo = 'shark_tank';
        } else {
          assignedTo = agents[0];
        }
      }
    }

    const assignment = this.assignmentRepository.create({
      leadId,
      assignedTo,
      routingRuleId: matchedRule?.id,
      status: matchedRule?.sharkTankEnabled ? AssignmentStatus.ASSIGNED : AssignmentStatus.ASSIGNED,
      assignedAt: new Date(),
      isSharkTank: matchedRule?.sharkTankEnabled ?? false,
      sharkTankExpiresAt: matchedRule?.sharkTankEnabled
        ? new Date(Date.now() + (matchedRule.sharkTankClaimMinutes ?? 30) * 60 * 1000)
        : null,
      groupId,
    });

    const saved = await this.assignmentRepository.save(assignment);
    this.logger.log(`Routed lead ${leadId} to ${assignedTo} via rule ${matchedRule?.name ?? 'default'}`);

    if (matchedRule?.speedToLeadEnabled) {
      this.logger.log(`Speed-to-lead triggered for lead ${leadId} — call=${matchedRule.autoCall}, text=${matchedRule.autoText}, email=${matchedRule.autoEmail}`);
    }

    return saved;
  }

  private async getNextRoundRobinAgent(agents: string[], groupId?: string): Promise<string> {
    const recentAssignments = await this.assignmentRepository.find({
      where: groupId ? { groupId } : {},
      order: { assignedAt: 'DESC' },
      take: 50,
    });

    const recentAgentCounts: Record<string, number> = {};
    for (const a of recentAssignments) {
      recentAgentCounts[a.assignedTo] = (recentAgentCounts[a.assignedTo] ?? 0) + 1;
    }

    return agents.sort((a, b) => (recentAgentCounts[a] ?? 0) - (recentAgentCounts[b] ?? 0))[0];
  }

  async claimLead(leadId: string, agentId: string): Promise<LeadAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { leadId, status: AssignmentStatus.ASSIGNED },
      order: { assignedAt: 'DESC' },
    });
    if (!assignment) throw new NotFoundException(`No assignable lead ${leadId}`);

    assignment.assignedTo = agentId;
    assignment.status = AssignmentStatus.CLAIMED;
    assignment.claimedAt = new Date();
    return this.assignmentRepository.save(assignment);
  }

  async getLeadAssignments(leadId?: string, assignedTo?: string, status?: AssignmentStatus): Promise<LeadAssignment[]> {
    const where: Record<string, unknown> = {};
    if (leadId) where.leadId = leadId;
    if (assignedTo) where.assignedTo = assignedTo;
    if (status) where.status = status;
    return this.assignmentRepository.find({ where, order: { assignedAt: 'DESC' } });
  }

  async getUnworkedLeads(hours: number = 24, groupId?: string): Promise<LeadAssignment[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const where: Record<string, unknown> = {
      status: AssignmentStatus.ASSIGNED,
      firstContactAt: IsNull(),
      assignedAt: LessThan(cutoff),
    };
    if (groupId) where.groupId = groupId;
    return this.assignmentRepository.find({ where, order: { assignedAt: 'ASC' } });
  }

  async redistributeLeads(hours: number = 24, groupId?: string): Promise<LeadAssignment[]> {
    const unworked = await this.getUnworkedLeads(hours, groupId);
    const reassigned: LeadAssignment[] = [];

    for (const assignment of unworked) {
      assignment.status = AssignmentStatus.REASSIGNED;
      assignment.releasedAt = new Date();
      await this.assignmentRepository.save(assignment);

      const newAssignment = await this.routeLead(
        assignment.leadId,
        undefined,
        undefined,
        undefined,
        groupId,
      );
      reassigned.push(newAssignment);
    }

    this.logger.log(`Redistributed ${reassigned.length} unworked leads`);
    return reassigned;
  }

  async getSharkTankLeads(groupId?: string): Promise<LeadAssignment[]> {
    const where: Record<string, unknown> = {
      isSharkTank: true,
      status: AssignmentStatus.ASSIGNED,
    };
    if (groupId) where.groupId = groupId;
    return this.assignmentRepository.find({ where, order: { assignedAt: 'DESC' } });
  }

  // ===========================================================================
  // COMPLIANCE — DNC, Consent, Communication Logging
  // ===========================================================================

  async checkDnc(phoneNumber: string): Promise<boolean> {
    const entry = await this.dncRepository.findOne({ where: { phoneNumber } });
    return !!entry;
  }

  async addToDnc(phoneNumber: string, source?: string, state?: string, notes?: string, groupId?: string): Promise<DncEntry> {
    const existing = await this.dncRepository.findOne({ where: { phoneNumber } });
    if (existing) return existing;

    const entry = this.dncRepository.create({
      phoneNumber,
      source,
      state,
      notes,
      addedAt: new Date(),
      groupId,
    });
    return this.dncRepository.save(entry);
  }

  async removeFromDnc(phoneNumber: string): Promise<void> {
    await this.dncRepository.delete({ phoneNumber });
  }

  async listDncEntries(groupId?: string, limit: number = 100): Promise<DncEntry[]> {
    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;
    return this.dncRepository.find({ where, order: { addedAt: 'DESC' }, take: limit });
  }

  async logConsent(input: {
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
  }): Promise<ConsentLog> {
    const log = this.consentRepository.create({
      ...input,
      consentTimestamp: new Date(),
    });
    return this.consentRepository.save(log);
  }

  async getConsentHistory(leadId?: string, clientId?: string): Promise<ConsentLog[]> {
    const where: Record<string, unknown> = {};
    if (leadId) where.leadId = leadId;
    if (clientId) where.clientId = clientId;
    return this.consentRepository.find({ where, order: { consentTimestamp: 'DESC' } });
  }

  async logCommunication(input: {
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
  }): Promise<CommunicationLog> {
    const log = this.communicationRepository.create({
      ...input,
      status: input.status ?? CommunicationStatus.SENT,
      wasRecorded: input.wasRecorded ?? false,
    });
    const saved = await this.communicationRepository.save(log);

    // Update assignment first-contact time
    if (input.leadId && input.direction === CommunicationDirection.OUTBOUND) {
      const assignment = await this.assignmentRepository.findOne({
        where: { leadId: input.leadId, firstContactAt: IsNull() },
        order: { assignedAt: 'DESC' },
      });
      if (assignment) {
        assignment.firstContactAt = new Date();
        assignment.secondsToContact = Math.round(
          (Date.now() - assignment.assignedAt.getTime()) / 1000,
        );
        await this.assignmentRepository.save(assignment);
      }
    }

    return saved;
  }

  async getCommunicationHistory(
    leadId?: string,
    clientId?: string,
    communicationType?: CommunicationType,
    limit: number = 50,
  ): Promise<CommunicationLog[]> {
    const where: Record<string, unknown> = {};
    if (leadId) where.leadId = leadId;
    if (clientId) where.clientId = clientId;
    if (communicationType) where.communicationType = communicationType;
    return this.communicationRepository.find({ where, order: { createdAt: 'DESC' }, take: limit });
  }

  // ===========================================================================
  // TASKS & CALLBACKS
  // ===========================================================================

  async listTasks(
    assignedTo?: string,
    leadId?: string,
    clientId?: string,
    status?: TaskStatus,
    type?: TaskType,
    groupId?: string,
  ): Promise<CrmTask[]> {
    const where: Record<string, unknown> = {};
    if (assignedTo) where.assignedTo = assignedTo;
    if (leadId) where.leadId = leadId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (groupId) where.groupId = groupId;
    return this.taskRepository.find({ where, order: { dueDate: 'ASC' } });
  }

  async createTask(input: {
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
  }): Promise<CrmTask> {
    const task = this.taskRepository.create({
      type: input.type ?? TaskType.GENERAL,
      title: input.title,
      description: input.description,
      priority: input.priority ?? TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      leadId: input.leadId,
      clientId: input.clientId,
      enrollmentId: input.enrollmentId,
      settlementId: input.settlementId,
      assignedTo: input.assignedTo,
      assignedBy: input.assignedBy,
      dueDate: input.dueDate,
      autoReminder: input.autoReminder ?? true,
      reminderMinutesBefore: input.reminderMinutesBefore ?? 15,
      metadata: input.metadata,
      groupId: input.groupId,
    });
    const saved = await this.taskRepository.save(task);
    this.logger.log(`Created task ${saved.id} — ${saved.title} for ${input.assignedTo}`);
    return saved;
  }

  async completeTask(taskId: string): Promise<CrmTask> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    return this.taskRepository.save(task);
  }

  async cancelTask(taskId: string): Promise<CrmTask> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    task.status = TaskStatus.CANCELLED;
    return this.taskRepository.save(task);
  }

  async getUpcomingTasks(assignedTo?: string, hoursAhead: number = 24, groupId?: string): Promise<CrmTask[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const where: Record<string, unknown> = {
      status: TaskStatus.PENDING,
      dueDate: MoreThan(now),
    };
    if (assignedTo) where.assignedTo = assignedTo;
    if (groupId) where.groupId = groupId;
    const tasks = await this.taskRepository.find({ where, order: { dueDate: 'ASC' } });
    return tasks.filter((t) => new Date(t.dueDate) <= cutoff);
  }

  async getOverdueTasks(assignedTo?: string, groupId?: string): Promise<CrmTask[]> {
    const now = new Date();
    const where: Record<string, unknown> = {
      status: TaskStatus.PENDING,
      dueDate: LessThan(now),
    };
    if (assignedTo) where.assignedTo = assignedTo;
    if (groupId) where.groupId = groupId;
    return this.taskRepository.find({ where, order: { dueDate: 'ASC' } });
  }

  async getTasksDueToday(assignedTo?: string, groupId?: string): Promise<CrmTask[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const where: Record<string, unknown> = {
      status: TaskStatus.PENDING,
    };
    if (assignedTo) where.assignedTo = assignedTo;
    if (groupId) where.groupId = groupId;
    const tasks = await this.taskRepository.find({ where, order: { dueDate: 'ASC' } });
    return tasks.filter((t) => {
      const due = new Date(t.dueDate);
      return due >= start && due <= end;
    });
  }

  // ===========================================================================
  // AI LEAD SCORING
  // ===========================================================================

  async scoreLead(leadId: string): Promise<{
    score: number;
    grade: string;
    factors: Record<string, number>;
    recommendations: string[];
  }> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException(`Lead ${leadId} not found`);

    const factors: Record<string, number> = {};
    let score = 0;

    // Debt amount scoring (0-30 points)
    const debt = Number(lead.totalDebt);
    if (debt >= 50000) { score += 30; factors.debt_amount = 30; }
    else if (debt >= 25000) { score += 25; factors.debt_amount = 25; }
    else if (debt >= 15000) { score += 20; factors.debt_amount = 20; }
    else if (debt >= 10000) { score += 15; factors.debt_amount = 15; }
    else if (debt >= 5000) { score += 10; factors.debt_amount = 10; }
    else { score += 5; factors.debt_amount = 5; }

    // Months behind (0-20 points)
    if (lead.monthsBehind) {
      if (lead.monthsBehind >= 6) { score += 20; factors.months_behind = 20; }
      else if (lead.monthsBehind >= 3) { score += 15; factors.months_behind = 15; }
      else if (lead.monthsBehind >= 1) { score += 10; factors.months_behind = 10; }
      else { score += 5; factors.months_behind = 5; }
    }

    // Employment status (0-15 points)
    if (lead.employmentStatus === 'employed') { score += 15; factors.employment = 15; }
    else if (lead.employmentStatus === 'self_employed') { score += 12; factors.employment = 12; }
    else if (lead.employmentStatus === 'retired') { score += 8; factors.employment = 8; }
    else { score += 3; factors.employment = 3; }

    // Monthly income (0-15 points)
    const income = Number(lead.monthlyIncome ?? 0);
    if (income >= 5000) { score += 15; factors.income = 15; }
    else if (income >= 3000) { score += 12; factors.income = 12; }
    else if (income >= 2000) { score += 8; factors.income = 8; }
    else if (income >= 1000) { score += 5; factors.income = 5; }
    else { score += 2; factors.income = 2; }

    // Credit score bucket (0-10 points)
    if (lead.creditScore === 'poor') { score += 10; factors.credit = 10; }
    else if (lead.creditScore === 'fair') { score += 8; factors.credit = 8; }
    else if (lead.creditScore === 'good') { score += 5; factors.credit = 5; }
    else { score += 3; factors.credit = 3; }

    // Debt types (0-10 points) — credit card debt settles best
    if (lead.debtTypes?.includes('credit_card')) { score += 7; factors.debt_type = 7; }
    if (lead.debtTypes?.includes('medical')) { score += 3; factors.debt_type = (factors.debt_type ?? 0) + 3; }
    if (lead.debtTypes?.includes('personal_loan')) { score += 2; factors.debt_type = (factors.debt_type ?? 0) + 2; }
    if (lead.debtTypes?.includes('collections')) { score += 5; factors.debt_type = (factors.debt_type ?? 0) + 5; }

    score = Math.min(score, 100);

    let grade = 'F';
    if (score >= 85) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 55) grade = 'C';
    else if (score >= 40) grade = 'D';

    const recommendations: string[] = [];
    if (score >= 70) recommendations.push('High priority — contact immediately');
    if (lead.monthsBehind && lead.monthsBehind >= 3) recommendations.push('Delinquent — prioritize for settlement');
    if (debt >= 25000) recommendations.push('High debt amount — eligible for premium program');
    if (lead.creditScore === 'poor') recommendations.push('Poor credit — settlement likely preferred over consolidation');
    if (lead.hasFiledBankruptcy) recommendations.push('Bankruptcy filed — verify discharge status before enrollment');

    // Update the lead with ML score
    lead.mlScore = score;
    lead.mlTier = grade;
    lead.mlFactors = factors;
    await this.leadRepository.save(lead);

    // Also update CRM lead if linked
    if (lead.userId) {
      const crmLead = await this.crmLeadRepository.findOne({
        where: { consumerLeadId: leadId },
      });
      if (crmLead) {
        crmLead.aiScore = score;
        crmLead.aiGrade = grade as any;
        crmLead.aiRecommendedActions = recommendations;
        crmLead.lastScoredAt = new Date();
        await this.crmLeadRepository.save(crmLead);
      }
    }

    return { score, grade, factors, recommendations };
  }

  // ===========================================================================
  // REPORTING & ANALYTICS
  // ===========================================================================

  async getOperationsReport(groupId?: string): Promise<{
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    qualifiedLeads: number;
    enrolledClients: number;
    contactRate: number;
    qualificationRate: number;
    enrollmentRate: number;
    averageSpeedToContact: number;
    totalCalls: number;
    totalTexts: number;
    totalEmails: number;
    connectedCalls: number;
    averageCallScore: number;
    pendingTasks: number;
    overdueTasks: number;
    dncCount: number;
    topAgents: { agentId: string; leadsAssigned: number; leadsContacted: number; enrollments: number }[];
  }> {
    const leadWhere: Record<string, unknown> = {};
    if (groupId) leadWhere.groupId = groupId;
    const leads = await this.leadRepository.find({ where: leadWhere });
    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === 'new').length;
    const contactedLeads = leads.filter((l) => ['sold', 'converted'].includes(l.status) || l.isVerified).length;
    const qualifiedLeads = leads.filter((l) => l.qualityTier === 'premium' || l.qualityTier === 'qualified').length;

    const assignmentWhere: Record<string, unknown> = {};
    if (groupId) assignmentWhere.groupId = groupId;
    const assignments = await this.assignmentRepository.find({ where: assignmentWhere });
    const contactedAssignments = assignments.filter((a) => a.firstContactAt);
    const averageSpeedToContact = contactedAssignments.length > 0
      ? contactedAssignments.reduce((s, a) => s + (a.secondsToContact ?? 0), 0) / contactedAssignments.length
      : 0;

    const commWhere: Record<string, unknown> = {};
    if (groupId) commWhere.groupId = groupId;
    const communications = await this.communicationRepository.find({ where: commWhere });
    const totalCalls = communications.filter((c) => [CommunicationType.CALL, CommunicationType.AI_CALL].includes(c.communicationType)).length;
    const totalTexts = communications.filter((c) => [CommunicationType.SMS, CommunicationType.AI_TEXT].includes(c.communicationType)).length;
    const totalEmails = communications.filter((c) => c.communicationType === CommunicationType.EMAIL).length;
    const connectedCalls = communications.filter(
      (c) => [CommunicationType.CALL, CommunicationType.AI_CALL].includes(c.communicationType) && c.status === CommunicationStatus.CONNECTED,
    ).length;
    const callsWithScore = communications.filter((c) => c.aiInsights?.callScore != null);
    const averageCallScore = callsWithScore.length > 0
      ? callsWithScore.reduce((s, c) => s + (c.aiInsights?.callScore ?? 0), 0) / callsWithScore.length
      : 0;

    const taskWhere: Record<string, unknown> = {};
    if (groupId) taskWhere.groupId = groupId;
    const tasks = await this.taskRepository.find({ where: taskWhere });
    const pendingTasks = tasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const overdueTasks = tasks.filter(
      (t) => t.status === TaskStatus.PENDING && new Date(t.dueDate) < new Date(),
    ).length;

    const dncWhere: Record<string, unknown> = {};
    if (groupId) dncWhere.groupId = groupId;
    const dncCount = await this.dncRepository.count({ where: dncWhere });

    // Top agents
    const agentStats: Record<string, { leadsAssigned: number; leadsContacted: number }> = {};
    for (const a of assignments) {
      if (!agentStats[a.assignedTo]) agentStats[a.assignedTo] = { leadsAssigned: 0, leadsContacted: 0 };
      agentStats[a.assignedTo].leadsAssigned++;
      if (a.firstContactAt) agentStats[a.assignedTo].leadsContacted++;
    }
    const topAgents = Object.entries(agentStats)
      .map(([agentId, stats]) => ({ agentId, ...stats, enrollments: 0 }))
      .sort((a, b) => b.leadsAssigned - a.leadsAssigned)
      .slice(0, 10);

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      enrolledClients: 0,
      contactRate: totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0,
      qualificationRate: contactedLeads > 0 ? (qualifiedLeads / contactedLeads) * 100 : 0,
      enrollmentRate: qualifiedLeads > 0 ? 0 : 0,
      averageSpeedToContact: Math.round(averageSpeedToContact),
      totalCalls,
      totalTexts,
      totalEmails,
      connectedCalls,
      averageCallScore: Math.round(averageCallScore * 10) / 10,
      pendingTasks,
      overdueTasks,
      dncCount,
      topAgents,
    };
  }
}
