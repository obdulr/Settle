import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalesGuard } from '../auth/guards/sales.guard';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, SalesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('leads')
  async getMyLeads(@Request() req) {
    return this.salesService.getMyLeads(req.user.id);
  }

  @Get('leads/stats')
  async getMyStats(@Request() req) {
    return this.salesService.getMyStats(req.user.id);
  }

  @Post('leads/:id/notes')
  async addNotes(
    @Param('id') leadId: string,
    @Request() req,
    @Body('notes') notes: string,
  ) {
    return this.salesService.addNotes(leadId, req.user.id, notes);
  }

  @Post('leads/:id/status')
  async updateStatus(
    @Param('id') leadId: string,
    @Request() req,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.salesService.convertLead(leadId, req.user.id, status, notes);
  }
}
