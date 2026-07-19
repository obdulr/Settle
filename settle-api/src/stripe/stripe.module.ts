import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from '../entities/provider.entity';
import { Lead } from '../entities/lead.entity';
import { User } from '../entities/user.entity';
import { CoachingSubscription } from '../entities/coaching-subscription.entity';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, Lead, User, CoachingSubscription]), ProvidersModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
