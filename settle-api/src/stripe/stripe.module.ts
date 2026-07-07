import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from '../entities/provider.entity';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Provider]), ProvidersModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
