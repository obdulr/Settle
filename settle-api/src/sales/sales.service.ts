import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /** Get all leads assigned to the logged-in sales agent. */
  async getMyLeads(salesAgentId: string) {
    return this.leadsRepository.find({
      where: { salesAgentId },
      order: { createdAt: 'DESC' },
    });
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
    const conversionRate = total > 0 ? Number(((converted / total) * 100).toFixed(2)) : 0;
    return { total, converted, new: newLeads, conversionRate };
  }

  /** Add or update sales notes on a lead. */
  async addNotes(leadId: string, salesAgentId: string, notes: string) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead || lead.salesAgentId !== salesAgentId) {
      throw new NotFoundException('Lead not found or not assigned to you');
    }
    const existing = lead.salesNotes ? `${lead.salesNotes}\n\n---\n` : '';
    lead.salesNotes = `${existing}[${new Date().toISOString()}] ${notes}`;
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
    if (notes) {
      const existing = lead.salesNotes ? `${lead.salesNotes}\n\n---\n` : '';
      lead.salesNotes = `${existing}[${new Date().toISOString()}] Status changed to ${status}. ${notes}`;
    }
    return this.leadsRepository.save(lead);
  }
}
