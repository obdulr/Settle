import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProviderGuard } from '../auth/guards/provider.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('matching')
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  // --- Consumer endpoints ---

  /** Public, consumer-facing: get recommended providers for a lead. */
  @Get('recommended/:leadId')
  async getRecommendedProviders(@Param('leadId') leadId: string) {
    return this.matchingService.getRecommendedProviders(leadId);
  }

  /** Consumer requests contact from a provider (body: { leadId, providerId }). */
  @Post('request-contact')
  async requestContact(@Body() body: { leadId: string; providerId: string }) {
    return this.matchingService.requestContact(body.leadId, body.providerId);
  }

  // --- Provider endpoints ---

  /** Provider: get leads matched to the authenticated provider. */
  @Get('matched-leads')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  async getMatchedLeads(@Request() req) {
    return this.matchingService.getMatchedLeadsForProvider(req.user.sub);
  }

  /** Provider or consumer: decline a match (ownership verified in service). */
  @Post(':id/decline')
  @UseGuards(JwtAuthGuard)
  async declineMatch(
    @Param('id') id: string,
    @Body('userType') userType: 'provider' | 'consumer' = 'provider',
    @Request() req,
  ) {
    return this.matchingService.declineMatch(id, userType, req.user.sub);
  }

  /** Provider: match history. */
  @Get('history')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  async getMatchHistory(@Request() req) {
    return this.matchingService.getMatchHistory(req.user.sub);
  }

  // --- Admin endpoints ---

  /** Admin: match statistics. */
  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getMatchStats() {
    return this.matchingService.getMatchStats();
  }

  /** Admin: all matches with pagination. */
  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllMatches(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.matchingService.getAllMatches(p, l);
  }
}
