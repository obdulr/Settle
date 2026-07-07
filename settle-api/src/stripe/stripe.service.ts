import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ProvidersService } from '../providers/providers.service';

export interface CreditPackage {
  credits: number;
  amount: number; // in dollars
  label: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 500, amount: 50, label: 'Starter' },
  { credits: 1000, amount: 90, label: 'Professional' },
  { credits: 2500, amount: 200, label: 'Business' },
  { credits: 5000, amount: 350, label: 'Enterprise' },
];

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private providersService: ProvidersService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey || 'sk_test_dummy', {
      apiVersion: '2026-06-24.dahlia',
    });
  }

  async createCustomer(email: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email });
    return customer.id;
  }

  async createCheckoutSession(
    providerId: string,
    credits: number,
    amount: number,
  ): Promise<Stripe.Checkout.Session> {
    const provider = await this.providersService.getProviderById(providerId);

    // Create or reuse Stripe customer
    let customerId = provider.stripeCustomerId;
    if (!customerId) {
      customerId = await this.createCustomer(provider.email);
      await this.providersService.updateProvider(providerId, { stripeCustomerId: customerId });
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3025';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Lead Credits`,
              description: `Purchase of ${credits} lead credits for the Settle marketplace.`,
            },
            unit_amount: amount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        providerId,
        credits: credits.toString(),
        amount: amount.toString(),
      },
      success_url: `${frontendUrl}/portal/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/portal/billing/cancel`,
    });

    return session;
  }

  async handleWebhook(signature: string, rawBody: Buffer): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret || '');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const providerId = session.metadata?.providerId;
        const credits = parseInt(session.metadata?.credits || '0', 10);

        if (providerId && credits > 0) {
          await this.providersService.addCredit(providerId, credits);
          this.logger.log(`Added ${credits} credits to provider ${providerId}`);
        } else {
          this.logger.warn(`checkout.session.completed missing metadata: ${JSON.stringify(session.metadata)}`);
        }
        break;
      }

      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed': {
        this.logger.warn(`Payment failed for event ${event.id}`);
        break;
      }

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }
}
