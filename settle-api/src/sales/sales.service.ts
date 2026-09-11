import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, IsNull } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { User } from '../entities/user.entity';
import { CommunicationLog, CommunicationType, CommunicationDirection, CommunicationStatus } from '../entities/communication-log.entity';

export interface EmailLeadDto {
  subject: string;
  body: string;
  template?: 'intro' | 'follow_up' | 'quote' | 'custom';
}

export interface ScheduleFollowUpDto {
  followUpDate: string; // ISO date
  notes?: string;
  type?: 'call' | 'email' | 'meeting';
}

export interface LogCallDto {
  phoneNumber: string;
  direction?: 'inbound' | 'outbound';
  duration?: number; // seconds
  status?: 'completed' | 'no_answer' | 'left_voicemail' | 'busy' | 'failed';
  notes?: string;
}

export interface DialLeadDto {
  to: string;
  from?: string;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(CommunicationLog)
    private commLogRepository: Repository<CommunicationLog>,
  ) {}

  /** Get all leads assigned to the logged-in sales agent. */
  async getMyLeads(salesAgentId: string) {
    return this.leadsRepository.find({
      where: { salesAgentId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Get new/unassigned leads (lead inbox — leads from website that need assignment). */
  async getInboxLeads(salesAgentId: string) {
    const [unassigned, mine] = await Promise.all([
      this.leadsRepository.find({
        where: { salesAgentId: IsNull() as any, status: 'new' },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.leadsRepository.find({
        where: { salesAgentId, status: 'new', lastContactedAt: IsNull() as any },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
    ]);
    return { unassigned, mine };
  }

  /** Assign a lead to the sales agent. */
  async assignLead(leadId: string, salesAgentId: string) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    lead.salesAgentId = salesAgentId;
    lead.salesAgentAssignedAt = new Date();
    if (lead.status === 'new') lead.status = 'available';
    return this.leadsRepository.save(lead);
  }

  /** Get lead statistics for a sales agent. */
  async getMyStats(salesAgentId: string) {
    const total = await this.leadsRepository.count({ where: { salesAgentId } });
    const converted = await this.leadsRepository.count({
      where: { salesAgentId, status: 'converted' },
    });
    const newLeads = await this.leadsRepository.count({
      where: { salesAgentId, status: 'new' },
    });
    const contacted = await this.leadsRepository.count({
      where: { salesAgentId, status: 'contacted' },
    });
    const interested = await this.leadsRepository.count({
      where: { salesAgentId, status: 'interested' },
    });
    const followUpsDue = await this.leadsRepository.count({
      where: { salesAgentId, followUpDate: LessThan(new Date()) as any },
    });
    const conversionRate = total > 0 ? Number(((converted / total) * 100).toFixed(2)) : 0;
    return { total, converted, new: newLeads, contacted, interested, followUpsDue, conversionRate };
  }

  /** Add or update sales notes on a lead. */
  async addNotes(leadId: string, salesAgentId: string, notes: string) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead || lead.salesAgentId !== salesAgentId) {
      throw new NotFoundException('Lead not found or not assigned to you');
    }
    const existing = lead.salesNotes ? `${lead.salesNotes}\n\n---\n` : '';
    lead.salesNotes = `${existing}[${new Date().toISOString()}] ${notes}`;
    lead.lastContactedAt = new Date();
    return this.leadsRepository.save(lead);
  }

  /** Mark a lead as converted (or update status). */
  async convertLead(leadId: string, salesAgentId: string, status: string, notes?: string) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead || lead.salesAgentId !== salesAgentId) {
      throw new NotFoundException('Lead not found or not assigned to you');
    }
    lead.status = status;
    if (status === 'converted') {
      lead.convertedAt = new Date();
    }
    lead.lastContactedAt = new Date();
    if (notes) {
      const existing = lead.salesNotes ? `${lead.salesNotes}\n\n---\n` : '';
      lead.salesNotes = `${existing}[${new Date().toISOString()}] Status changed to ${status}. ${notes}`;
    }
    return this.leadsRepository.save(lead);
  }

  /** Send an email to a lead via Resend. */
  async emailLead(leadId: string, salesAgentId: string, dto: EmailLeadDto) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead || lead.salesAgentId !== salesAgentId) {
      throw new NotFoundException('Lead not found or not assigned to you');
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@settleinpeace.com';
    const agent = await this.usersRepository.findOne({ where: { id: salesAgentId } });
    const fromName = agent ? `${agent.firstName || ''} ${agent.lastName || ''}`.trim() : 'Settle In Peace';
    const replyTo = agent?.email || fromEmail;

    let sent = false;
    let error: string | undefined;

    if (apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: lead.email,
            reply_to: replyTo,
            subject: dto.subject,
            html: dto.body,
          }),
        });
        const data = await res.json() as any;
        if (!res.ok) {
          error = data?.message || 'Resend API error';
        } else {
          sent = true;
        }
      } catch (err: any) {
        error = err.message;
      }
    } else {
      this.logger.warn('RESEND_API_KEY not set — email logged but not sent');
      sent = true; // dev mode
    }

    // Log the communication
    const log = this.commLogRepository.create({
      leadId: lead.id,
      userId: salesAgentId,
      communicationType: CommunicationType.EMAIL,
      direction: CommunicationDirection.OUTBOUND,
      status: sent ? CommunicationStatus.SENT : CommunicationStatus.FAILED,
      subject: dto.subject,
      body: dto.body,
    });
    await this.commLogRepository.save(log);

    // Update lead's lastContactedAt and add to notes
    lead.lastContactedAt = new Date();
    const existingNotes = lead.salesNotes ? `${lead.salesNotes}\n\n---\n` : '';
    lead.salesNotes = `${existingNotes}[${new Date().toISOString()}] Email sent: "${dto.subject}"${sent ? '' : ` (FAILED: ${error})`}`;
    await this.leadsRepository.save(lead);

    return { success: sent, error };
  }

  /** Log a call to a lead. */
  async logCall(leadId: string, salesAgentId: string, dto: LogCallDto) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead || lead.salesAgentId !== salesAgentId) {
      throw new NotFoundException('Lead not found or not assigned to you');
    }

    const log = this.commLogRepository.create({
      leadId: lead.id,
      userId: salesAgentId,
      communicationType: CommunicationType.CALL,
      direction: (dto.direction as any) || CommunicationDirection.OUTBOUND,
      status: (dto.status as any) || CommunicationStatus.SENT,
      subject: `Call to ${dto.phoneNumber}`,
      body: dto.notes || '',
    });
    await this.commLogRepository.save(log);

    lead.lastContactedAt = new Date();
    const existingNotes = lead.salesNotes ? `${lead.salesNotes}\n\n---\n` : '';
    const durationStr = dto.duration ? ` (${Math.floor(dto.duration / 60)}m ${dto.duration % 60}s)` : '';
    lead.salesNotes = `${existingNotes}[${new Date().toISOString()}] ${dto.direction || 'outbound'} call to ${dto.phoneNumber}${durationStr} — ${dto.status || 'completed'}. ${dto.notes || ''}`;
    await this.leadsRepository.save(lead);

    return { success: true };
  }

  /** Get call/communication history for a lead. */
  async getLeadCommunications(leadId: string, salesAgentId: string) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead || lead.salesAgentId !== salesAgentId) {
      throw new NotFoundException('Lead not found or not assigned to you');
    }
    return this.commLogRepository.find({
      where: { leadId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Initiate an outbound call via Telnyx. */
  async dialLead(leadId: string, salesAgentId: string, dto: DialLeadDto) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead || lead.salesAgentId !== salesAgentId) {
      throw new NotFoundException('Lead not found or not assigned to you');
    }

    const fromNumber = dto.from || process.env.TELNYX_FROM_NUMBER;
    const connectionId = process.env.TELNYX_CONNECTION_ID;
    const apiKey = process.env.TELNYX_API_KEY;

    let callControlId: string | undefined;
    let error: string | undefined;

    if (apiKey && connectionId && fromNumber) {
      try {
        const res = await fetch('https://api.telnyx.com/v2/calls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            connection_id: connectionId,
            to: dto.to,
            from: fromNumber,
          }),
        });
        const data = await res.json() as any;
        if (!res.ok) {
          error = data?.errors?.[0]?.detail || data?.message || 'Telnyx API error';
        } else {
          callControlId = data?.data?.call_control_id;
        }
      } catch (err: any) {
        error = err.message;
      }
    } else {
      // Dev mode — no actual call
      callControlId = `mock-${Date.now()}`;
    }

    // Log the call
    const log = this.commLogRepository.create({
      leadId: lead.id,
      userId: salesAgentId,
      communicationType: CommunicationType.CALL,
      direction: CommunicationDirection.OUTBOUND,
      status: error ? CommunicationStatus.FAILED : CommunicationStatus.SENT,
      subject: `Dial ${dto.to}`,
      body: error ? `Failed: ${error}` : `Call initiated (control: ${callControlId})`,
    });
    await this.commLogRepository.save(log);

    lead.lastContactedAt = new Date();
    await this.leadsRepository.save(lead);

    return { success: !error, callControlId, error };
  }

  /** Schedule a follow-up for a lead. */
  async scheduleFollowUp(leadId: string, salesAgentId: string, dto: ScheduleFollowUpDto) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead || lead.salesAgentId !== salesAgentId) {
      throw new NotFoundException('Lead not found or not assigned to you');
    }
    lead.followUpDate = new Date(dto.followUpDate);
    const existingNotes = lead.salesNotes ? `${lead.salesNotes}\n\n---\n` : '';
    lead.salesNotes = `${existingNotes}[${new Date().toISOString()}] Follow-up scheduled for ${new Date(dto.followUpDate).toISOString()} (${dto.type || 'call'}). ${dto.notes || ''}`;
    return this.leadsRepository.save(lead);
  }

  /** Get calendar (upcoming follow-ups) for a sales agent. */
  async getCalendar(salesAgentId: string) {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [upcoming, overdue, allFollowUps] = await Promise.all([
      this.leadsRepository.find({
        where: { salesAgentId, followUpDate: MoreThan(now) as any },
        order: { followUpDate: 'ASC' },
        take: 50,
      }),
      this.leadsRepository.find({
        where: { salesAgentId, followUpDate: LessThan(now) as any },
        order: { followUpDate: 'ASC' },
        take: 50,
      }),
      this.leadsRepository.find({
        where: { salesAgentId },
        order: { followUpDate: 'ASC' },
        take: 100,
      }),
    ]);

    return { upcoming, overdue, all: allFollowUps };
  }

  /** Get communication history for a sales agent (all leads). */
  async getCommunications(salesAgentId: string) {
    return this.commLogRepository.find({
      where: { userId: salesAgentId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /** Get leads due for follow-up (for automated reminders). */
  async getLeadsDueForFollowUp(): Promise<Lead[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return this.leadsRepository.find({
      where: { followUpDate: LessThan(tomorrow) as any, status: 'contacted' as any },
    });
  }
}
