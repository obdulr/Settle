import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmLead } from '../entities/crm-lead.entity';
import { CrmDeal } from '../entities/crm-deal.entity';
import { CrmClient } from '../entities/crm-client.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmLead, CrmDeal, CrmClient]),
    AuthModule,
  ],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
