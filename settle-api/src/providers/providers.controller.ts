import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  // Public: consumer comparison page fetches active providers
  @Get()
  async getActiveProviders(
    @Query('debtType') debtType?: string,
    @Query('state') state?: string,
    @Query('minDebt') minDebt?: string,
  ) {
    return this.providersService.getAllActiveProviders({
      debtType,
      state,
      minDebt: minDebt ? parseFloat(minDebt) : undefined,
    });
  }

  // Public: single provider profile page
  @Get(':id')
  async getProvider(@Param('id') id: string) {
    return this.providersService.getProviderById(id);
  }

  // Public: provider signup (creates pending account awaiting admin approval)
  @Post('signup')
  async signupProvider(@Body() body: any) {
    return this.providersService.createProvider(body);
  }

  // Provider: update their own profile
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() body: any) {
    return this.providersService.updateProvider(req.user.sub, body);
  }

  // Provider: get own stats
  @Get('portal/stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req) {
    return this.providersService.getProviderStats(req.user.sub);
  }
}