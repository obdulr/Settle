import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { ProvidersService } from '../providers/providers.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    private providersService: ProvidersService,
  ) {}

  async submitAssessment(data: Partial<Lead>): Promise<Lead> {
    const score = this.calculateQualityScore(data);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const lead = this.leadsRepository.create({
      ...data,
      qualityScore: score,
      status: score >= 40 ? 'available' : 'new',
      expiresAt,
      tcpaConsent: true,
      consentTimestamp: new Date(),
    });

    return this.leadsRepository.save(lead);
  }

  private calculateQualityScore(data: Partial<Lead>): number {
    let score = 0;

    if (data.totalDebt && data.totalDebt >= 50000) score += 40;
    else if (data.totalDebt && data.totalDebt >= 25000) score += 30;
    else if (data.totalDebt && data.totalDebt >= 10000) score += 20;
    else if (data.totalDebt && data.totalDebt >= 7500) score += 10;

    if (data.monthsBehind && data.monthsBehind >= 3) score += 20;
    else if (data.monthsBehind && data.monthsBehind >= 1) score += 10;

    if (data.employmentStatus === 'employed') score += 20;
    else if (data.employmentStatus === 'self_employed') score += 15;
    else if (data.employmentStatus === 'retired') score += 10;

    if (data.monthlyIncome && data.monthlyIncome >= 5000) score += 20;
    else if (data.monthlyIncome && data.monthlyIncome >= 3000) score += 10;

    return Math.min(score, 100);
  }

  calculateLeadPrice(lead: Partial<Lead>): number {
    const debt = Number(lead.totalDebt) || 0;
    if (debt >= 50000) return 300;
    if (debt >= 25000) return 200;
    if (debt >= 15000) return 150;
    if (debt >= 10000) return 100;
    return 75;
  }

  async getAvailableLeads() {
    return this.leadsRepository.find({
      where: { status: 'available' },
      order: { qualityScore: 'DESC', createdAt: 'DESC' },
      take: 50,
    });
  }

  async purchaseLead(leadId: string, providerId: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status !== 'available') throw new BadRequestException('Lead is no longer available');

    const provider = await this.providersService.getProviderById(providerId);
    const price = this.calculateLeadPrice(lead);

    if (Number(provider.creditBalance) < price) {
      throw new BadRequestException('Insufficient credit balance. Please add funds to your account.');
    }

    await this.providersService.deductCredit(providerId, price);

    await this.leadsRepository.update(leadId, {
      status: 'sold',
      purchasedBy: providerId,
      salePrice: price,
      purchasedAt: new Date(),
    });

    return this.leadsRepository.findOne({ where: { id: leadId } }) as Promise<Lead>;
  }

  async getLeadsByProvider(providerId: string) {
    return this.leadsRepository.find({
      where: { purchasedBy: providerId },
      order: { purchasedAt: 'DESC' },
    });
  }

  async getLeadStats() {
    const total = await this.leadsRepository.count();
    const available = await this.leadsRepository.count({ where: { status: 'available' } });
    const sold = await this.leadsRepository.count({ where: { status: 'sold' } });
    return { total, available, sold };
  }

  /**
   * Provider-only: get full lead details before purchase. Sensitive contact
   * info (phone, email, last name) is masked unless this provider has
   * purchased the lead.
   */
  async getLeadDetails(leadId: string, providerId: string) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const purchased = lead.purchasedBy === providerId;
    if (purchased) {
      return { ...lead, isPurchased: true };
    }

    // Mask sensitive fields for unpurchased leads
    return {
      ...lead,
      phone: this.maskValue(lead.phone),
      email: this.maskEmail(lead.email),
      lastName: this.maskValue(lead.lastName),
      isPurchased: false,
    };
  }

  /**
   * Provider-only: purchase multiple leads in a single call. Returns results
   * per lead id with success/failure status. Skips leads that are unavailable
   * or that the provider cannot afford (deducts from credit balance per
   * successful purchase).
   */
  async batchPurchaseLeads(leadIds: string[], providerId: string) {
    const provider = await this.providersService.getProviderById(providerId);
    let remainingCredit = Number(provider.creditBalance) || 0;

    const results: Array<{ leadId: string; success: boolean; price?: number; error?: string }> = [];
    const successful: Lead[] = [];

    for (const leadId of leadIds) {
      const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
      if (!lead) {
        results.push({ leadId, success: false, error: 'Lead not found' });
        continue;
      }
      if (lead.status !== 'available') {
        results.push({ leadId, success: false, error: 'Lead is no longer available' });
        continue;
      }

      const price = this.calculateLeadPrice(lead);
      if (remainingCredit < price) {
        results.push({ leadId, success: false, error: 'Insufficient credit balance' });
        continue;
      }

      await this.leadsRepository.update(leadId, {
        status: 'sold',
        purchasedBy: providerId,
        salePrice: price,
        purchasedAt: new Date(),
      });
      await this.providersService.deductCredit(providerId, price);
      remainingCredit -= price;
      successful.push(lead);
      results.push({ leadId, success: true, price });
    }

    return {
      results,
      purchased: successful.length,
      failed: results.length - successful.length,
      totalCost: results.reduce((sum, r) => sum + (r.success ? (r.price as number) : 0), 0),
      remainingCredit,
    };
  }

  /**
   * Consumer: checks whether their lead has been purchased. Returns a boolean
   * and the provider's company name if purchased.
   */
  async getLeadStatus(leadId: string): Promise<{ purchased: boolean; providerName?: string; purchasedAt?: Date }> {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    if (lead.status === 'sold' && lead.purchasedBy) {
      try {
        const provider = await this.providersService.getProviderById(lead.purchasedBy);
        return {
          purchased: true,
          providerName: (provider as any).companyName,
          purchasedAt: lead.purchasedAt,
        };
      } catch {
        return { purchased: true, purchasedAt: lead.purchasedAt };
      }
    }

    return { purchased: false };
  }

  // --- helpers ---

  private maskValue(value: string | undefined): string {
    if (!value) return '';
    if (value.length <= 2) return '**';
    return value.slice(0, 1) + '*'.repeat(Math.max(value.length - 2, 1)) + value.slice(-1);
  }

  private maskEmail(email: string | undefined): string {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return this.maskValue(email);
    const maskedLocal = local.length <= 2 ? '**' : local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 1));
    return `${maskedLocal}@${domain}`;
  }
}