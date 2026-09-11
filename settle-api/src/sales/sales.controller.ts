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
import { SalesService, EmailLeadDto, ScheduleFollowUpDto, LogCallDto, DialLeadDto } from './sales.service';

interface AuthenticatedRequest extends Request {
  user: { sub: string; id: string; role: string; email: string };
}

@Controller('sales')
@UseGuards(JwtAuthGuard, SalesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ─── Leads ───
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

  // ─── Lead Inbox (new leads from website) ───
  @Get('inbox')
  async getInbox(@Request() req) {
    return this.salesService.getInboxLeads(req.user.id);
  }

  @Post('leads/:id/assign')
  async assignLead(@Param('id') leadId: string, @Request() req) {
    return this.salesService.assignLead(leadId, req.user.id);
  }

  // ─── Email ───
  @Post('leads/:id/email')
  async emailLead(
    @Param('id') leadId: string,
    @Request() req,
    @Body() dto: EmailLeadDto,
  ) {
    return this.salesService.emailLead(leadId, req.user.id, dto);
  }

  // ─── Dialer / Calls ───
  @Post('leads/:id/dial')
  async dialLead(
    @Param('id') leadId: string,
    @Request() req,
    @Body() dto: DialLeadDto,
  ) {
    return this.salesService.dialLead(leadId, req.user.id, dto);
  }

  @Post('leads/:id/call-log')
  async logCall(
    @Param('id') leadId: string,
    @Request() req,
    @Body() dto: LogCallDto,
  ) {
    return this.salesService.logCall(leadId, req.user.id, dto);
  }

  @Get('leads/:id/communications')
  async getLeadCommunications(
    @Param('id') leadId: string,
    @Request() req,
  ) {
    return this.salesService.getLeadCommunications(leadId, req.user.id);
  }

  @Get('communications')
  async getCommunications(@Request() req) {
    return this.salesService.getCommunications(req.user.id);
  }

  // ─── Calendar / Follow-ups ───
  @Post('leads/:id/schedule')
  async scheduleFollowUp(
    @Param('id') leadId: string,
    @Request() req,
    @Body() dto: ScheduleFollowUpDto,
  ) {
    return this.salesService.scheduleFollowUp(leadId, req.user.id, dto);
  }

  @Get('calendar')
  async getCalendar(@Request() req) {
    return this.salesService.getCalendar(req.user.id);
  }
}
