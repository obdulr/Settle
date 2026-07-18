import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { Lead } from '../entities/lead.entity';
import { Provider } from '../entities/provider.entity';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Lead, Provider]), EmailModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
