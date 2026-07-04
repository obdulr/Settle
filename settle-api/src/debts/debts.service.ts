import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt } from '../entities/debt.entity';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debt)
    private debtsRepository: Repository<Debt>,
  ) {}

  async createDebt(userId: string, debtData: Partial<Debt>) {
    const debt = this.debtsRepository.create({
      ...debtData,
      userId,
      originalBalance: debtData.balance,
      status: 'active',
    });
    return this.debtsRepository.save(debt);
  }

  async getUserDebts(userId: string) {
    return this.debtsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDebtById(id: string, userId: string) {
    const debt = await this.debtsRepository.findOne({ where: { id, userId } });
    if (!debt) {
      throw new NotFoundException('Debt not found');
    }
    return debt;
  }

  async updateDebt(id: string, userId: string, updateData: Partial<Debt>) {
    const debt = await this.getDebtById(id, userId);
    await this.debtsRepository.update(id, updateData);
    return this.debtsRepository.findOne({ where: { id } });
  }

  async deleteDebt(id: string, userId: string) {
    const debt = await this.getDebtById(id, userId);
    await this.debtsRepository.delete(id);
    return { message: 'Debt deleted successfully' };
  }

  async getTotalDebt(userId: string) {
    const debts = await this.getUserDebts(userId);
    return debts.reduce((total, debt) => total + Number(debt.balance), 0);
  }

  async getDebtSummary(userId: string) {
    const debts = await this.getUserDebts(userId);
    const totalDebt = debts.reduce((total, debt) => total + Number(debt.balance), 0);
    const totalOriginal = debts.reduce((total, debt) => total + Number(debt.originalBalance || debt.balance), 0);
    
    const byType = debts.reduce((acc, debt) => {
      acc[debt.type] = (acc[debt.type] || 0) + Number(debt.balance);
      return acc;
    }, {} as Record<string, number>);

    const byStatus = debts.reduce((acc, debt) => {
      acc[debt.status] = (acc[debt.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDebt,
      totalOriginal,
      totalSaved: totalOriginal - totalDebt,
      debtCount: debts.length,
      byType,
      byStatus,
    };
  }
}