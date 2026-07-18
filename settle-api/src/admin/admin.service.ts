import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Provider } from '../entities/provider.entity';
import { Lead } from '../entities/lead.entity';
import { Match } from '../entities/match.entity';
import { EmailService } from '../email/email.service';
import { MatchingService } from '../matching/matching.service';

type SafeProvider = Omit<Provider, 'password'>;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Provider)
    private providersRepository: Repository<Provider>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private emailService: EmailService,
    private matchingService: MatchingService,
  ) {}

  /** List all providers regardless of status. */
  async getAllProviders(): Promise<SafeProvider[]> {
    const providers = await this.providersRepository.find({
      order: { createdAt: 'DESC' },
    });
    return providers.map(this.stripPassword);
  }

  /** List only providers awaiting approval. */
  async getPendingProviders(): Promise<SafeProvider[]> {
    const providers = await this.providersRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
    return providers.map(this.stripPassword);
  }

  /** Approve a provider - sets status to 'active' and sends approval email. */
  async approveProvider(id: string): Promise<SafeProvider> {
    const provider = await this.findProviderOrFail(id);

    if (provider.status === 'active') {
      throw new BadRequestException('Provider is already active');
    }

    provider.status = 'active';
    provider.emailVerified = true;
    const saved = await this.providersRepository.save(provider);

    // Fire-and-forget email - don't block the response on email delivery.
    this.emailService
      .sendProviderApprovalEmail(saved.email, saved.companyName)
      .then((ok) => {
        if (!ok) {
          this.logger.warn(`Approval email may not have been delivered to ${saved.email}`);
        }
      })
      .catch((err) =>
        this.logger.error(`Failed to send approval email: ${err instanceof Error ? err.message : String(err)}`),
      );

    this.logger.log(`Provider ${id} (${saved.companyName}) approved`);
    return this.stripPassword(saved);
  }

  /** Reject a provider - sets status to 'rejected' and sends rejection email. */
  async rejectProvider(id: string, reason?: string): Promise<SafeProvider> {
    const provider = await this.findProviderOrFail(id);

    provider.status = 'rejected';
    const saved = await this.providersRepository.save(provider);

    this.emailService
      .sendProviderRejectionEmail(saved.email, saved.companyName, reason)
      .then((ok) => {
        if (!ok) {
          this.logger.warn(`Rejection email may not have been delivered to ${saved.email}`);
        }
      })
      .catch((err) =>
        this.logger.error(`Failed to send rejection email: ${err instanceof Error ? err.message : String(err)}`),
      );

    this.logger.log(`Provider ${id} (${saved.companyName}) rejected`);
    return this.stripPassword(saved);
  }

  /** Suspend a provider - sets status to 'suspended'. */
  async suspendProvider(id: string): Promise<SafeProvider> {
    const provider = await this.findProviderOrFail(id);

    if (provider.status === 'suspended') {
      throw new BadRequestException('Provider is already suspended');
    }

    provider.status = 'suspended';
    const saved = await this.providersRepository.save(provider);

    this.logger.log(`Provider ${id} (${saved.companyName}) suspended`);
    return this.stripPassword(saved);
  }

  // --- lead & match admin endpoints ---

  /** Admin: list all leads with pagination (filter by status). */
  async getAllLeads(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const options: FindManyOptions<Lead> = {
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    };
    if (status) {
      options.where = { status };
    }
    const [data, total] = await this.leadsRepository.findAndCount(options);
    return { data, total, page, limit };
  }

  /** Admin: lead statistics (total, by status, by quality score range, conversion rate). */
  async getLeadStats() {
    const total = await this.leadsRepository.count();
    const byStatus: Record<string, number> = {};
    const statuses = ['new', 'available', 'sold', 'converted', 'rejected', 'expired'];
    for (const s of statuses) {
      byStatus[s] = await this.leadsRepository.count({ where: { status: s } });
    }

    const byQualityRange: Record<string, number> = {
      '0-25': await this.leadsRepository.createQueryBuilder('l').where('l.quality_score >= 0 AND l.quality_score < 25').getCount(),
      '25-50': await this.leadsRepository.createQueryBuilder('l').where('l.quality_score >= 25 AND l.quality_score < 50').getCount(),
      '50-75': await this.leadsRepository.createQueryBuilder('l').where('l.quality_score >= 50 AND l.quality_score < 75').getCount(),
      '75-100': await this.leadsRepository.createQueryBuilder('l').where('l.quality_score >= 75 AND l.quality_score <= 100').getCount(),
    };

    const sold = byStatus['sold'] || 0;
    const converted = byStatus['converted'] || 0;
    const conversionRate = total > 0 ? Number(((sold / total) * 100).toFixed(2)) : 0;
    const successRate = sold > 0 ? Number(((converted / sold) * 100).toFixed(2)) : 0;

    return { total, byStatus, byQualityRange, conversionRate, successRate };
  }

  /** Admin: manually assign a lead to a provider (optionally at a custom price). */
  async manualAssignLead(leadId: string, providerId: string, price?: number) {
    const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const provider = await this.providersRepository.findOne({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    const salePrice = price ?? this.calculateLeadPrice(lead);

    await this.leadsRepository.update(leadId, {
      status: 'sold',
      purchasedBy: providerId,
      salePrice,
      purchasedAt: new Date(),
    });

    // Update any existing match record to 'purchased'
    const match = await this.matchesRepository.findOne({ where: { leadId, providerId } });
    if (match) {
      match.status = 'purchased';
      await this.matchesRepository.save(match);
    }

    this.logger.log(`Lead ${leadId} manually assigned to provider ${providerId} at price ${salePrice}`);
    return this.leadsRepository.findOne({ where: { id: leadId } });
  }

  /** Admin: adjust a provider's credit balance (positive or negative amount). */
  async adjustProviderCredits(providerId: string, amount: number, reason?: string) {
    const provider = await this.findProviderOrFail(providerId);
    const newBalance = Number(provider.creditBalance) + amount;
    if (newBalance < 0) {
      throw new BadRequestException('Resulting credit balance cannot be negative');
    }
    await this.providersRepository.update(providerId, { creditBalance: newBalance });
    this.logger.log(`Adjusted credits for provider ${providerId} by ${amount} (reason: ${reason ?? 'n/a'})`);
    return this.stripPassword(await this.findProviderOrFail(providerId));
  }

  /** Admin: view all matches with pagination. */
  async getAllMatches(page = 1, limit = 20) {
    return this.matchingService.getAllMatches(page, limit);
  }

  // --- helpers ---

  private calculateLeadPrice(lead: Partial<Lead>): number {
    const debt = Number(lead.totalDebt) || 0;
    if (debt >= 50000) return 300;
    if (debt >= 25000) return 200;
    if (debt >= 15000) return 150;
    if (debt >= 10000) return 100;
    return 75;
  }

  private async findProviderOrFail(id: string): Promise<Provider> {
    const provider = await this.providersRepository.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    return provider;
  }

  private stripPassword({ password: _, ...rest }: Provider): SafeProvider {
    return rest;
  }
}
