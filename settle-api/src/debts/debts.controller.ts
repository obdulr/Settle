import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dtos/create-debt.dto';
import { UpdateDebtDto } from './dtos/update-debt.dto';

@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private debtsService: DebtsService) {}

  @Post()
  async createDebt(@Request() req, @Body() createDebtDto: CreateDebtDto) {
    return this.debtsService.createDebt(req.user.sub, createDebtDto);
  }

  @Get()
  async getUserDebts(@Request() req) {
    return this.debtsService.getUserDebts(req.user.sub);
  }

  @Get('summary')
  async getDebtSummary(@Request() req) {
    return this.debtsService.getDebtSummary(req.user.sub);
  }

  @Get(':id')
  async getDebtById(@Param('id') id: string, @Request() req) {
    return this.debtsService.getDebtById(id, req.user.sub);
  }

  @Put(':id')
  async updateDebt(@Param('id') id: string, @Request() req, @Body() updateDebtDto: UpdateDebtDto) {
    return this.debtsService.updateDebt(id, req.user.sub, updateDebtDto);
  }

  @Delete(':id')
  async deleteDebt(@Param('id') id: string, @Request() req) {
    return this.debtsService.deleteDebt(id, req.user.sub);
  }
}