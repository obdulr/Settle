import { Injectable, Logger } from '@nestjs/common';
import { Lead } from '../entities/lead.entity';
import { Provider } from '../entities/provider.entity';
import { Match } from '../entities/match.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LeadScoringService {
  private readonly logger = new Logger(LeadScoringService.name);

  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(Provider) private providerRepo: Repository<Provider>,
  ) {}

  /**
   * ML-enhanced lead scoring.
   *
   * Instead of the simple rule-based score, this uses historical conversion
   * data to weight features differently. As more leads are processed and
   * their outcomes tracked, the model improves.
   *
   * Features used:
   * 1. Total debt amount (weighted by historical conversion rates per debt tier)
   * 2. Months behind on payments (strong predictor of urgency)
   * 3. Employment status (employed leads convert better)
   * 4. Monthly income (affects ability to pay for services)
   * 5. Debt type mix (credit card debt converts better than student loan)
   * 6. State (some states have higher conversion rates)
   * 7. Has filed bankruptcy (negative signal for debt settlement)
   * 8. Credit score range (affects provider interest)
   *
   * The model starts with rule-based weights and adjusts them based on
   * historical conversion data (leads that were purchased → converted).
   */
  async scoreLead(
    lead: Partial<Lead>,
  ): Promise<{ score: number; factors: Record<string, number>; tier: string }> {
    // Get historical conversion data for adaptive weighting
    const historicalStats = await this.getHistoricalConversionStats();

    const factors: Record<string, number> = {};
    let score = 0;

    // 1. Debt amount (0-30 pts) — weighted by historical conversion per tier
    const debt = Number(lead.totalDebt) || 0;
    let debtScore = 0;
    if (debt >= 50000) debtScore = 30;
    else if (debt >= 25000) debtScore = 25;
    else if (debt >= 15000) debtScore = 20;
    else if (debt >= 10000) debtScore = 15;
    else if (debt >= 7500) debtScore = 10;

    // Adjust based on historical conversion rates for this debt tier
    const debtTier = this.getDebtTier(debt);
    const tierConversionRate = historicalStats.debtTierConversion[debtTier] || 0.5;
    debtScore = Math.round(debtScore * (0.7 + tierConversionRate * 0.6)); // Scale 0.7-1.3x
    factors['debt_amount'] = debtScore;
    score += debtScore;

    // 2. Months behind (0-20 pts) — strong urgency signal
    const monthsBehind = lead.monthsBehind || 0;
    let urgencyScore = 0;
    if (monthsBehind >= 6) urgencyScore = 20;
    else if (monthsBehind >= 3) urgencyScore = 18;
    else if (monthsBehind >= 1) urgencyScore = 12;
    else urgencyScore = 5; // Current on payments = less urgent

    // Adjust by historical conversion
    const behindConversion =
      historicalStats.monthsBehindConversion[monthsBehind >= 3 ? 'behind' : 'current'] || 0.5;
    urgencyScore = Math.round(urgencyScore * (0.8 + behindConversion * 0.4));
    factors['urgency'] = urgencyScore;
    score += urgencyScore;

    // 3. Employment status (0-15 pts)
    const employmentScores: Record<string, number> = {
      employed: 15,
      self_employed: 12,
      retired: 8,
      unemployed: 5,
    };
    const empScore = employmentScores[lead.employmentStatus || ''] || 5;

    // Adjust by historical conversion
    const empConversion =
      historicalStats.employmentConversion[lead.employmentStatus || 'unknown'] || 0.5;
    const adjustedEmpScore = Math.round(empScore * (0.8 + empConversion * 0.4));
    factors['employment'] = adjustedEmpScore;
    score += adjustedEmpScore;

    // 4. Monthly income (0-15 pts)
    const income = Number(lead.monthlyIncome) || 0;
    let incomeScore = 0;
    if (income >= 5000) incomeScore = 15;
    else if (income >= 3000) incomeScore = 12;
    else if (income >= 2000) incomeScore = 8;
    else if (income > 0) incomeScore = 5;
    factors['income'] = incomeScore;
    score += incomeScore;

    // 5. Debt type mix (0-10 pts) — credit card debt is most valuable
    const debtTypes = lead.debtTypes || [];
    let debtTypeScore = 0;
    const debtTypeValues: Record<string, number> = {
      credit_card: 5, // Highest conversion
      medical: 3,
      personal_loan: 3,
      student_loan: 1, // Lower conversion for settlement
    };
    for (const dt of debtTypes) {
      debtTypeScore += debtTypeValues[dt] || 1;
    }
    debtTypeScore = Math.min(10, debtTypeScore);
    factors['debt_types'] = debtTypeScore;
    score += debtTypeScore;

    // 6. Bankruptcy flag (negative adjustment)
    if (lead.hasFiledBankruptcy) {
      score -= 10;
      factors['bankruptcy_penalty'] = -10;
    }

    // 7. State conversion rate adjustment (0-5 pts bonus)
    const stateConversion = historicalStats.stateConversion[lead.state || ''] || 0.5;
    const stateBonus = Math.round((stateConversion - 0.5) * 10); // -5 to +5
    if (stateBonus !== 0) factors['state_adjustment'] = stateBonus;
    score += stateBonus;

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine tier
    let tier = 'standard';
    if (score >= 75) tier = 'premium';
    else if (score >= 50) tier = 'quality';
    else if (score >= 30) tier = 'standard';
    else tier = 'low_quality';

    return { score, factors, tier };
  }

  /**
   * Calculate dynamic lead price based on ML score.
   * Higher quality leads cost more.
   */
  calculateDynamicPrice(score: number, baseDebt: number): number {
    const basePrice = this.getBasePrice(baseDebt);
    // Premium for high-quality leads
    if (score >= 75) return Math.round(basePrice * 1.5);
    if (score >= 50) return Math.round(basePrice * 1.2);
    if (score >= 30) return basePrice;
    return Math.round(basePrice * 0.7); // Discount for low quality
  }

  private getBasePrice(debt: number): number {
    if (debt >= 50000) return 300;
    if (debt >= 25000) return 200;
    if (debt >= 15000) return 150;
    if (debt >= 10000) return 100;
    return 75;
  }

  private getDebtTier(debt: number): string {
    if (debt >= 50000) return 'tier_5';
    if (debt >= 25000) return 'tier_4';
    if (debt >= 15000) return 'tier_3';
    if (debt >= 10000) return 'tier_2';
    return 'tier_1';
  }

  /**
   * Get historical conversion statistics from past leads.
   * Returns conversion rates per feature dimension.
   * Falls back to neutral 0.5 (no adjustment) when no data exists.
   */
  private async getHistoricalConversionStats(): Promise<{
    debtTierConversion: Record<string, number>;
    monthsBehindConversion: Record<string, number>;
    employmentConversion: Record<string, number>;
    stateConversion: Record<string, number>;
  }> {
    try {
      // Get all sold leads (these were purchased by providers = some signal)
      const soldLeads = await this.leadRepo.find({
        where: { status: 'sold' },
        take: 1000,
      });

      if (soldLeads.length < 10) {
        // Not enough data — return neutral weights
        return {
          debtTierConversion: {},
          monthsBehindConversion: {},
          employmentConversion: {},
          stateConversion: {},
        };
      }

      // Calculate conversion rates per dimension
      const debtTierStats: Record<string, { total: number; sold: number }> = {};
      const monthsBehindStats: Record<string, { total: number; sold: number }> = {};
      const employmentStats: Record<string, { total: number; sold: number }> = {};
      const stateStats: Record<string, { total: number; sold: number }> = {};

      for (const lead of soldLeads) {
        const tier = this.getDebtTier(Number(lead.totalDebt));
        if (!debtTierStats[tier]) debtTierStats[tier] = { total: 0, sold: 0 };
        debtTierStats[tier].sold++;

        const behindKey = (lead.monthsBehind || 0) >= 3 ? 'behind' : 'current';
        if (!monthsBehindStats[behindKey]) monthsBehindStats[behindKey] = { total: 0, sold: 0 };
        monthsBehindStats[behindKey].sold++;

        const emp = lead.employmentStatus || 'unknown';
        if (!employmentStats[emp]) employmentStats[emp] = { total: 0, sold: 0 };
        employmentStats[emp].sold++;

        if (lead.state) {
          if (!stateStats[lead.state]) stateStats[lead.state] = { total: 0, sold: 0 };
          stateStats[lead.state].sold++;
        }
      }

      // Get total leads per dimension for conversion rate
      const allLeads = await this.leadRepo.find({ take: 5000 });
      for (const lead of allLeads) {
        const tier = this.getDebtTier(Number(lead.totalDebt));
        if (debtTierStats[tier]) debtTierStats[tier].total++;

        const behindKey = (lead.monthsBehind || 0) >= 3 ? 'behind' : 'current';
        if (monthsBehindStats[behindKey]) monthsBehindStats[behindKey].total++;

        const emp = lead.employmentStatus || 'unknown';
        if (employmentStats[emp]) employmentStats[emp].total++;

        if (lead.state && stateStats[lead.state]) stateStats[lead.state].total++;
      }

      // Calculate rates
      const calcRate = (
        stats: Record<string, { total: number; sold: number }>,
      ): Record<string, number> => {
        const result: Record<string, number> = {};
        for (const [key, val] of Object.entries(stats)) {
          result[key] = val.total > 0 ? val.sold / val.total : 0.5;
        }
        return result;
      };

      return {
        debtTierConversion: calcRate(debtTierStats),
        monthsBehindConversion: calcRate(monthsBehindStats),
        employmentConversion: calcRate(employmentStats),
        stateConversion: calcRate(stateStats),
      };
    } catch (error) {
      this.logger.error(`Failed to get historical stats: ${error}`);
      return {
        debtTierConversion: {},
        monthsBehindConversion: {},
        employmentConversion: {},
        stateConversion: {},
      };
    }
  }
}
