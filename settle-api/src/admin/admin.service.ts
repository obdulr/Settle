import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../entities/provider.entity';
import { EmailService } from '../email/email.service';

type SafeProvider = Omit<Provider, 'password'>;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Provider)
    private providersRepository: Repository<Provider>,
    private emailService: EmailService,
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

  // --- helpers ---

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
