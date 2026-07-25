import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, LessThan } from 'typeorm';
import { Deposit } from '../entities/deposit.entity';
import { Provider } from '../entities/provider.entity';
import { ProvidersService } from '../providers/providers.service';
import { PROVIDER_SUBSCRIPTION_TIERS } from '../stripe/stripe.service';
import { BankingWebhookDto, SubmitDepositDto, ManualDepositDto } from './billing.dto';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);
  private lastRenewalRun: string | null = null;

  constructor(
    @InjectRepository(Deposit)
    private depositsRepository: Repository<Deposit>,
    @InjectRepository(Provider)
    private providersRepository: Repository<Provider>,
    private providersService: ProvidersService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const oneHour = 60 * 60 * 1000;
    setInterval(() => this.maybeProcessRenewals(), oneHour);
    this.logger.log('Billing renewal scheduler started (runs daily at 09:00 local)');
  }

  private async maybeProcessRenewals() {
    const now = new Date();
    if (now.getHours() !== 9) return;
    const today = now.toISOString().split('T')[0];
    if (this.lastRenewalRun === today) return;
    this.lastRenewalRun = today;
    await this.processRenewals();
  }

  verifyWebhookSignature(signature?: string) {
    const secret = this.configService.get<string>('BANKING_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('BANKING_WEBHOOK_SECRET is not set — accepting webhook without signature');
      return;
    }
    if (!signature || signature !== secret) {
      throw new BadRequestException('Invalid banking webhook signature');
    }
  }

  async processBankingWebhook(dto: BankingWebhookDto) {
    const reference = dto.reference.trim();
    let provider: Provider | null = null;

    // Try matching by DEP-<providerId> or plain provider id
    if (reference.toUpperCase().startsWith('DEP-')) {
      const id = reference.slice(4).trim();
      provider = await this.providersRepository.findOne({ where: { id } });
    }
    if (!provider) {
      provider = await this.providersRepository.findOne({ where: { id: reference } });
    }

    const deposit = this.depositsRepository.create({
      providerId: provider ? provider.id : undefined,
      amount: dto.amount,
      method: dto.method,
      reference,
      externalTransactionId: dto.externalTransactionId,
      status: provider ? 'approved' : 'pending',
      approvedBy: provider ? 'system' : undefined,
      notes: provider ? 'Auto-approved by banking webhook' : 'Could not match reference to a provider',
    });

    await this.depositsRepository.save(deposit);

    if (provider) {
      await this.providersService.addCredit(provider.id, dto.amount);
      this.logger.log(`Auto-credited ${dto.amount} to provider ${provider.id} via ${dto.method}`);
      return { status: 'approved', depositId: deposit.id, providerId: provider.id };
    }

    this.logger.warn(`Unmatched banking deposit: ${reference} for ${dto.amount}`);
    return { status: 'pending', depositId: deposit.id };
  }

  async submitDeposit(providerId: string, dto: SubmitDepositDto) {
    const deposit = this.depositsRepository.create({
      providerId,
      amount: dto.amount,
      method: dto.method,
      reference: dto.reference,
      status: 'pending',
      notes: dto.notes,
    });
    await this.depositsRepository.save(deposit);
    return deposit;
  }

  async getDeposits(filters: { providerId?: string; status?: string } = {}) {
    return this.depositsRepository.find({
      where: filters,
      order: { createdAt: 'DESC' },
    });
  }

  async getDepositById(id: string) {
    const deposit = await this.depositsRepository.findOne({ where: { id } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    return deposit;
  }

  async approveDeposit(depositId: string, adminUserId: string) {
    const deposit = await this.getDepositById(depositId);
    if (deposit.status === 'approved') return deposit;

    deposit.status = 'approved';
    deposit.approvedBy = adminUserId;
    await this.depositsRepository.save(deposit);

    if (deposit.providerId) {
      await this.providersService.addCredit(deposit.providerId, Number(deposit.amount));
      this.logger.log(`Admin ${adminUserId} approved and credited ${deposit.amount} to provider ${deposit.providerId}`);
    }

    return deposit;
  }

  async rejectDeposit(depositId: string, reason?: string) {
    const deposit = await this.getDepositById(depositId);
    if (deposit.status === 'rejected') return deposit;

    deposit.status = 'rejected';
    deposit.notes = reason ? `Rejected: ${reason}` : deposit.notes;
    await this.depositsRepository.save(deposit);
    return deposit;
  }

  async manualDeposit(adminUserId: string, dto: ManualDepositDto) {
    const provider = await this.providersRepository.findOne({ where: { id: dto.providerId } });
    if (!provider) throw new NotFoundException('Provider not found');

    const deposit = this.depositsRepository.create({
      providerId: dto.providerId,
      amount: dto.amount,
      method: dto.method,
      reference: dto.reference,
      status: 'approved',
      approvedBy: adminUserId,
      notes: dto.notes || 'Manual deposit created by admin',
    });
    await this.depositsRepository.save(deposit);
    await this.providersService.addCredit(dto.providerId, dto.amount);
    return deposit;
  }

  async processRenewals() {
    const now = new Date();
    const providers = await this.providersRepository.find({
      where: {
        subscriptionType: 'marketplace_seat',
        currentPeriodEnd: LessThan(now),
      },
    });

    for (const provider of providers) {
      const tier = PROVIDER_SUBSCRIPTION_TIERS.find((t) => t.id === provider.subscriptionTier);
      if (!tier) {
        this.logger.warn(`Provider ${provider.id} has marketplace_seat but no tier; skipping renewal`);
        continue;
      }

      const price = Number(tier.priceMonthly);
      const balance = Number(provider.creditBalance);

      if (balance >= price) {
        await this.providersService.deductCredit(provider.id, price);
        const nextPeriod = new Date();
        nextPeriod.setMonth(nextPeriod.getMonth() + 1);
        await this.providersRepository.update(provider.id, {
          currentPeriodEnd: nextPeriod,
          subscriptionStatus: 'active',
          isAcceptingLeads: true,
        });
        this.logger.log(`Renewed provider ${provider.id} for tier ${tier.id}`);
      } else {
        await this.providersRepository.update(provider.id, {
          subscriptionStatus: 'past_due',
          isAcceptingLeads: false,
        });
        this.logger.warn(`Provider ${provider.id} renewal failed: insufficient balance (${balance} < ${price})`);
      }
    }
  }
}
