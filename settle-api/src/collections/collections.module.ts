import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionAccount } from '../entities/collection-account.entity';
import { DebtorProfile } from '../entities/debtor-profile.entity';
import { CollectionNote } from '../entities/collection-note.entity';
import { SkipTraceResult } from '../entities/skip-trace-result.entity';
import { CallLog } from '../entities/call-log.entity';
import { CreditReport } from '../entities/credit-report.entity';
import { BackgroundCheck } from '../entities/background-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CollectionAccount, DebtorProfile, CollectionNote, SkipTraceResult, CallLog, CreditReport, BackgroundCheck])],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
