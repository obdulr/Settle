import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StripeService, CREDIT_PACKAGES } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(@Req() req: Request & { user: any }, @Body() body: { credits: number }) {
    const providerId = req.user.sub;
    const pkg = CREDIT_PACKAGES.find((p) => p.credits === body.credits);

    if (!pkg) {
      throw new BadRequestException(
        `Invalid credit package. Available packages: ${CREDIT_PACKAGES.map((p) => p.credits).join(', ')}`,
      );
    }

    const session = await this.stripeService.createCheckoutSession(providerId, pkg.credits, pkg.amount);
    return { url: session.url, sessionId: session.id };
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request & { rawBody?: Buffer }) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody as Buffer;
    if (!rawBody) {
      throw new BadRequestException('Raw body not available for signature verification');
    }

    await this.stripeService.handleWebhook(signature, rawBody);
    return { received: true };
  }
}
