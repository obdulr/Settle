import { LeadScoringService, LeadQualityTier } from './lead-scoring.service';
import { Lead } from '../entities/lead.entity';

describe('LeadScoringService', () => {
  let service: LeadScoringService;

  beforeEach(() => {
    service = new LeadScoringService();
  });

  // Helper to build a partial Lead with sensible defaults
  const makeLead = (overrides: Partial<Lead> = {}): Partial<Lead> => ({
    totalDebt: 0,
    monthsBehind: 0,
    employmentStatus: '',
    creditScore: '',
    state: '',
    hasFiledBankruptcy: false,
    ...overrides,
  });

  // ═════════════════════════════════════════════════════════════════════
  // HIGH-QUALITY LEAD
  // ═════════════════════════════════════════════════════════════════════
  describe('high-quality lead', () => {
    it('scores a premium lead with high debt, good state, employed, poor credit', () => {
      const lead = makeLead({
        totalDebt: 25000,
        monthsBehind: 6,
        employmentStatus: 'employed',
        creditScore: 'poor',
        state: 'CA',
        hasFiledBankruptcy: false,
      });

      const result = service.scoreLead(lead);

      // debt >10k = 35, months >=6 = 20, employed = 15, poor = 15, CA = 15 → 100
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.tier).toBe('premium');
    });

    it('includes factor breakdown with correct keys', () => {
      const lead = makeLead({
        totalDebt: 15000,
        monthsBehind: 3,
        employmentStatus: 'employed',
        creditScore: 'fair',
        state: 'NY',
      });

      const result = service.scoreLead(lead);

      const factorKeys = result.factors.map((f) => f.key);
      expect(factorKeys).toContain('debt_amount');
      expect(factorKeys).toContain('months_behind');
      expect(factorKeys).toContain('employment');
      expect(factorKeys).toContain('credit_score');
      expect(factorKeys).toContain('state');
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // LOW-QUALITY LEAD
  // ═════════════════════════════════════════════════════════════════════
  describe('low-quality lead', () => {
    it('scores a low lead with minimal debt, current on payments, unemployed', () => {
      const lead = makeLead({
        totalDebt: 3000,
        monthsBehind: 0,
        employmentStatus: 'unemployed',
        creditScore: 'excellent',
        state: 'WY', // not in high-value or standard states
        hasFiledBankruptcy: false,
      });

      const result = service.scoreLead(lead);

      // debt <5k = 8, months 0 = 4, unemployed = 4, excellent = 1, WY = 5 → 22
      expect(result.score).toBeLessThan(40);
      expect(result.tier).toBe('low');
    });

    it('applies bankruptcy penalty', () => {
      const lead = makeLead({
        totalDebt: 25000,
        monthsBehind: 6,
        employmentStatus: 'employed',
        creditScore: 'poor',
        state: 'CA',
        hasFiledBankruptcy: true,
      });

      const result = service.scoreLead(lead);

      // Without bankruptcy: 35+20+15+15+15 = 100. With -15 penalty: 85
      const bankruptcyFactor = result.factors.find((f) => f.key === 'bankruptcy');
      expect(bankruptcyFactor).toBeDefined();
      expect(bankruptcyFactor!.points).toBe(-15);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // TIER CLASSIFICATION
  // ═════════════════════════════════════════════════════════════════════
  describe('tier classification (tierForScore)', () => {
    it.each([
      [100, 'premium'],
      [80, 'premium'],
      [79, 'qualified'],
      [60, 'qualified'],
      [59, 'standard'],
      [40, 'standard'],
      [39, 'low'],
      [0, 'low'],
    ])('score %i → tier %s', (score, expectedTier) => {
      expect(service.tierForScore(score)).toBe(expectedTier as LeadQualityTier);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // SCORE BOUNDS
  // ═════════════════════════════════════════════════════════════════════
  describe('score bounds', () => {
    it('clamps score to a maximum of 100', () => {
      const lead = makeLead({
        totalDebt: 50000,
        monthsBehind: 12,
        employmentStatus: 'employed',
        creditScore: 'poor',
        state: 'CA',
        hasFiledBankruptcy: false,
      });

      const result = service.scoreLead(lead);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('clamps score to a minimum of 0', () => {
      const lead = makeLead({
        totalDebt: 0,
        monthsBehind: 0,
        employmentStatus: 'unemployed',
        creditScore: 'excellent',
        state: '',
        hasFiledBankruptcy: true,
      });

      const result = service.scoreLead(lead);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // BUILD BREAKDOWN
  // ═════════════════════════════════════════════════════════════════════
  describe('buildBreakdown', () => {
    it('returns a breakdown with leadId, score, tier, and factors', () => {
      const lead = {
        id: 'lead-123',
        totalDebt: 20000,
        monthsBehind: 4,
        employmentStatus: 'employed',
        creditScore: 'fair',
        state: 'TX',
        hasFiledBankruptcy: false,
        qualityScore: 85,
        qualityTier: 'premium',
      } as Lead;

      const breakdown = service.buildBreakdown(lead);

      expect(breakdown.leadId).toBe('lead-123');
      expect(breakdown.score).toBe(85); // uses persisted score
      expect(breakdown.tier).toBe('premium'); // uses persisted tier
      expect(breakdown.factors.length).toBeGreaterThan(0);
      expect(breakdown.calculatedAt).toBeDefined();
    });

    it('falls back to computed score when not persisted', () => {
      const lead = {
        id: 'lead-456',
        totalDebt: 3000,
        monthsBehind: 0,
        employmentStatus: 'unemployed',
        creditScore: 'excellent',
        state: 'WY',
        hasFiledBankruptcy: false,
        qualityScore: undefined,
        qualityTier: undefined,
      } as Lead;

      const breakdown = service.buildBreakdown(lead);

      const computed = service.scoreLead(lead);
      expect(breakdown.score).toBe(computed.score);
      expect(breakdown.tier).toBe(computed.tier);
    });
  });
});
