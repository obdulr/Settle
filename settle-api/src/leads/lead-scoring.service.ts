import { Injectable, Logger } from '@nestjs/common';
import { Lead } from '../entities/lead.entity';

/**
 * Quality tier a lead falls into based on its 0-100 quality score.
 */
export type LeadQualityTier = 'premium' | 'qualified' | 'standard' | 'low';

/**
 * A single factor contribution to the overall lead quality score.
 */
export interface ScoreFactor {
  key: string;
  label: string;
  points: number;
  detail: string;
}

/**
 * Full breakdown returned by the scoring service / score endpoint.
 */
export interface LeadScoreBreakdown {
  leadId: string;
  score: number;
  tier: LeadQualityTier;
  factors: ScoreFactor[];
  calculatedAt: string;
}

/**
 * Rule-based lead quality scoring service.
 *
 * Scores a lead 0-100 based on the signals that predict whether a debt
 * settlement lead will convert and complete a settlement program:
 *
 *   - Debt amount        (0-35 pts)  higher debt = higher quality
 *   - Months behind      (0-20 pts)  more behind = more urgent
 *   - Employment status  (0-15 pts)  employed converts better
 *   - Credit score       (0-15 pts)  lower score = more motivated to settle
 *   - State              (0-15 pts)  high-regulation/high-value states score higher
 *   - Bankruptcy flag    (-15 pts)   filed bankruptcy = limited settlement options
 *
 * Tiers:
 *   premium   80-100
 *   qualified 60-79
 *   standard  40-59
 *   low       0-39
 */
@Injectable()
export class LeadScoringService {
  private readonly logger = new Logger(LeadScoringService.name);

  /**
   * States with stronger debt-settlement regulation and/or higher market
   * value. These tend to produce higher-value leads (more demand, higher
   * fees, larger debt balances) so they receive the maximum state bonus.
   */
  private readonly HIGH_VALUE_STATES = new Set([
    'CA', 'NY', 'IL', 'FL', 'TX', 'NJ', 'MA', 'PA', 'GA', 'OH', 'MI', 'NC',
    'VA', 'WA', 'AZ', 'MD',
  ]);

  /**
   * States with moderate regulation / market value.
   */
  private readonly STANDARD_STATES = new Set([
    'CO', 'MN', 'OR', 'WI', 'TN', 'MO', 'IN', 'NV', 'CT', 'SC', 'AL', 'LA',
    'KY', 'OK', 'UT', 'KS',
  ]);

  /**
   * Calculate the 0-100 quality score and tier for a lead.
   */
  scoreLead(lead: Partial<Lead>): { score: number; tier: LeadQualityTier; factors: ScoreFactor[] } {
    const factors: ScoreFactor[] = [];

    // 1. Debt amount (0-35)
    const debt = Number(lead.totalDebt) || 0;
    let debtPoints = 8;
    let debtDetail = 'Under $5k (basic)';
    if (debt > 10000) {
      debtPoints = 35;
      debtDetail = `>$10k ($${debt.toLocaleString()} — premium)`;
    } else if (debt >= 5000) {
      debtPoints = 22;
      debtDetail = `$5k–$10k ($${debt.toLocaleString()} — standard)`;
    }
    factors.push({ key: 'debt_amount', label: 'Debt Amount', points: debtPoints, detail: debtDetail });

    // 2. Months behind (0-20)
    const monthsBehind = lead.monthsBehind ?? 0;
    let urgencyPoints = 4;
    let urgencyDetail = 'Current on payments';
    if (monthsBehind >= 6) {
      urgencyPoints = 20;
      urgencyDetail = `${monthsBehind}+ months behind (critical urgency)`;
    } else if (monthsBehind >= 3) {
      urgencyPoints = 15;
      urgencyDetail = `${monthsBehind} months behind (high urgency)`;
    } else if (monthsBehind >= 1) {
      urgencyPoints = 10;
      urgencyDetail = `${monthsBehind} month(s) behind (moderate urgency)`;
    }
    factors.push({ key: 'months_behind', label: 'Months Behind', points: urgencyPoints, detail: urgencyDetail });

    // 3. Employment status (0-15)
    const employmentScores: Record<string, number> = {
      employed: 15,
      self_employed: 11,
      retired: 8,
      unemployed: 4,
    };
    const empStatus = lead.employmentStatus || '';
    const empPoints = employmentScores[empStatus] ?? 4;
    factors.push({
      key: 'employment',
      label: 'Employment Status',
      points: empPoints,
      detail: empStatus ? `${empStatus} (${empPoints > 8 ? 'higher conversion' : 'lower conversion'})` : 'Not provided',
    });

    // 4. Credit score (0-15) — lower score = higher quality (more motivated)
    const creditScores: Record<string, number> = {
      poor: 15,
      fair: 11,
      good: 6,
      very_good: 2,
      excellent: 1,
    };
    const creditKey = lead.creditScore || '';
    const creditPoints = creditScores[creditKey] ?? 7; // neutral when unknown
    factors.push({
      key: 'credit_score',
      label: 'Credit Score',
      points: creditPoints,
      detail: creditKey ? `${creditKey} (${creditPoints >= 11 ? 'motivated to settle' : 'less motivated'})` : 'Not provided (neutral)',
    });

    // 5. State (0-15) — high-regulation / high-value states score higher
    const state = (lead.state || '').toUpperCase();
    let statePoints = 5;
    let stateDetail = `${state || 'Unknown'} (standard market)`;
    if (this.HIGH_VALUE_STATES.has(state)) {
      statePoints = 15;
      stateDetail = `${state} (high-regulation / high-value state)`;
    } else if (this.STANDARD_STATES.has(state)) {
      statePoints = 10;
      stateDetail = `${state} (moderate-value state)`;
    }
    factors.push({ key: 'state', label: 'State', points: statePoints, detail: stateDetail });

    // 6. Bankruptcy flag (-15 penalty)
    if (lead.hasFiledBankruptcy) {
      factors.push({
        key: 'bankruptcy',
        label: 'Bankruptcy Filed',
        points: -15,
        detail: 'Has filed bankruptcy — limited settlement options',
      });
    }

    const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
    const score = Math.max(0, Math.min(100, rawScore));
    const tier = this.tierForScore(score);

    return { score, tier, factors };
  }

  /**
   * Map a 0-100 score to a quality tier.
   */
  tierForScore(score: number): LeadQualityTier {
    if (score >= 80) return 'premium';
    if (score >= 60) return 'qualified';
    if (score >= 40) return 'standard';
    return 'low';
  }

  /**
   * Build a full breakdown for the score endpoint, including the lead id
   * and a timestamp. Reads the stored score/tier when available so the
   * endpoint reflects what was persisted at lead-creation time.
   */
  buildBreakdown(lead: Lead): LeadScoreBreakdown {
    // Recompute the factor breakdown from the lead data so the endpoint
    // always shows the current contributing signals, but prefer the
    // persisted score/tier (set at creation) when present.
    const computed = this.scoreLead(lead);
    const score = lead.qualityScore ?? computed.score;
    const tier = (lead.qualityTier as LeadQualityTier) ?? computed.tier;

    return {
      leadId: lead.id,
      score,
      tier,
      factors: computed.factors,
      calculatedAt: new Date().toISOString(),
    };
  }
}
