import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Provider } from '../entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providersRepository: Repository<Provider>,
  ) {}

  async createProvider(data: Partial<Provider> & { password: string }) {
    const existing = await this.providersRepository.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('A provider with this email already exists');

    console.log('[PROVIDER] Creating provider with email:', data.email, 'password length:', data.password?.length);
    const hashed = await bcrypt.hash(data.password, 10);
    console.log('[PROVIDER] Hashed password length:', hashed.length);
    const provider = this.providersRepository.create({ ...data, password: hashed, status: 'pending' });
    const saved = await this.providersRepository.save(provider);
    const { password: _, ...result } = saved;
    return result;
  }

  async getAllActiveProviders(filters?: { debtType?: string; state?: string; minDebt?: number }) {
    const qb = this.providersRepository
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'active' })
      .andWhere('p.isAcceptingLeads = true');

    if (filters?.minDebt) {
      qb.andWhere('p.minDebtAmount <= :minDebt', { minDebt: filters.minDebt });
    }

    const providers = await qb.orderBy('p.avgRating', 'DESC').getMany();
    return providers.map(({ password: _, ...p }) => p);
  }

  async getProviderById(id: string) {
    const provider = await this.providersRepository.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');
    const { password: _, ...result } = provider;
    return result;
  }

  async getProviderByEmail(email: string) {
    return this.providersRepository.findOne({ where: { email } });
  }

  async updateProvider(id: string, data: Partial<Provider>) {
    await this.providersRepository.update(id, data);
    return this.getProviderById(id);
  }

  async deductCredit(id: string, amount: number) {
    await this.providersRepository.decrement({ id }, 'creditBalance', amount);
  }

  async addCredit(id: string, amount: number) {
    await this.providersRepository.increment({ id }, 'creditBalance', amount);
  }

  async getProviderStats(id: string) {
    const provider = await this.getProviderById(id);
    return {
      creditBalance: provider.creditBalance,
      successfulSettlements: provider.successfulSettlements,
      avgRating: provider.avgRating,
      reviewCount: provider.reviewCount,
      isAcceptingLeads: provider.isAcceptingLeads,
    };
  }
}