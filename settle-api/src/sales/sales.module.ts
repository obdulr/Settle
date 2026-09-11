import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Lead } from '../entities/lead.entity';
import { User } from '../entities/user.entity';
import { CommunicationLog } from '../entities/communication-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, User, CommunicationLog])],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
