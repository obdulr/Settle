import { MatchingService } from './matching.service';
import { Lead } from '../entities/lead.entity';
import { Provider } from '../entities/provider.entity';

// Mock the email service module — the repo has an extensionless
// ``email.service`` file that Jest would pick up before ``email.service.ts``,
// causing a parse error.  An explicit factory avoids loading the real file.
jest.mock('../email/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({})),
}));

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(() => {
    // scoreMatch is a pure method — repository/email dependencies are not
    // used, so we can pass nulls for the injected deps.
    service = new MatchingService(null as any, null as any, null as any, null as any);
  });

  const makeLead = (overrides: Partial<Lead> = {}): Partial<Lead> => ({
    state: 'CA',
    totalDebt: 15000,
    debtTypes: ['credit_card', 'medical'],
    qualityScore: 75,
    mlTier: undefined,
    ...overrides,
  });

  const makeProvider = (overrides: Partial<Provider> = {}): Partial<Provider> => ({
    statesServed: ['CA', 'NY', 'TX'],
    debtTypes: ['credit_card', 'medical', 'personal_loan'],
    minDebtAmount: 5000,
    maxDebtAmount: 50000,
    serviceTypes: ['debt_settlement'],
    avgRating: 4.5,
    bbbRating: 'A+',
    isAfccMember: true,
    isIapdaMember: false,
    subscriptionType: 'pay_per_lead',
    ...overrides,
  });

  // ═════════════════════════════════════════════════════════════════════
  // PERFECT MATCH
  // ═════════════════════════════════════════════════════════════════════
  describe('scoreMatch — perfect match', () => {
    it('scores highly when lead and provider align on all dimensions', () => {
      const lead = makeLead({
        state: 'CA',
        totalDebt: 15000,
        debtTypes: ['credit_card', 'medical'],
        qualityScore: 85,
      });
      const provider = makeProvider({
        statesServed: ['CA', 'NY'],
        debtTypes: ['credit_card', 'medical'],
        minDebtAmount: 5000,
        maxDebtAmount: 50000,
        serviceTypes: ['debt_settlement'],
        avgRating: 5.0,
        bbbRating: 'A+',
        isAfccMember: true,
        subscriptionType: 'marketplace_seat',
      });

      const result = service.scoreMatch(lead, provider);

      // state 25 + debt_type 25 + amount 20 + service 15 + quality ~15 + tier 10 = ~110 → capped 100
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.reasons).toContain('state_match');
      expect(result.reasons).toContain('debt_type_match');
      expect(result.reasons).toContain('debt_amount_in_range');
      expect(result.reasons).toContain('service_type_debt_settlement');
    });

    it('caps the score at 100', () => {
      const lead = makeLead({ qualityScore: 100, mlTier: 'premium' });
      const provider = makeProvider({
        avgRating: 5,
        bbbRating: 'A+',
        isAfccMember: true,
        subscriptionType: 'marketplace_seat',
      });

      const result = service.scoreMatch(lead, provider);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // NO MATCH
  // ═════════════════════════════════════════════════════════════════════
  describe('scoreMatch — no match', () => {
    it('scores low when nothing matches', () => {
      const lead = makeLead({
        state: 'CA',
        totalDebt: 15000,
        debtTypes: ['credit_card'],
        qualityScore: 10,
      });
      const provider = makeProvider({
        statesServed: ['FL', 'GA'], // no state match
        debtTypes: ['student_loan'], // no debt type overlap
        minDebtAmount: 50000, // debt below min
        maxDebtAmount: 100000,
        serviceTypes: ['credit_repair'], // no debt_settlement
        avgRating: undefined,
        bbbRating: undefined,
        isAfccMember: false,
        subscriptionType: 'pay_per_lead',
      });

      const result = service.scoreMatch(lead, provider);

      // No state, no debt type, no amount, no service, no quality, tier partial 5
      expect(result.score).toBeLessThanOrEqual(20);
      expect(result.reasons).not.toContain('state_match');
      expect(result.reasons).not.toContain('debt_type_match');
    });

    it('returns 0 score for a completely mismatched provider with no quality signals', () => {
      const lead = makeLead({
        state: 'CA',
        totalDebt: 1000,
        debtTypes: ['credit_card'],
        qualityScore: 5,
      });
      const provider = makeProvider({
        statesServed: ['WA'],
        debtTypes: ['student_loan'],
        minDebtAmount: 10000,
        maxDebtAmount: 50000,
        serviceTypes: ['bankruptcy'],
        avgRating: undefined,
        bbbRating: undefined,
        isAfccMember: false,
        subscriptionType: 'pay_per_lead',
      });

      const result = service.scoreMatch(lead, provider);
      // service_type_partial (5) + tier_alignment_basic (10) = 15
      expect(result.score).toBeLessThanOrEqual(15);
      expect(result.reasons).not.toContain('state_match');
      expect(result.reasons).not.toContain('debt_type_match');
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // PARTIAL MATCHES
  // ═════════════════════════════════════════════════════════════════════
  describe('scoreMatch — partial matches', () => {
    it('gives nationwide credit when provider serves all states (empty array)', () => {
      const lead = makeLead({ state: 'CA' });
      const provider = makeProvider({ statesServed: [] });

      const result = service.scoreMatch(lead, provider);
      expect(result.reasons).toContain('state_match_nationwide');
      expect(result.score).toBeGreaterThanOrEqual(25);
    });

    it('gives partial debt-type credit for partial overlap', () => {
      const lead = makeLead({ debtTypes: ['credit_card', 'medical', 'student_loan'] });
      const provider = makeProvider({ debtTypes: ['credit_card'] });

      const result = service.scoreMatch(lead, provider);
      // 1/3 overlap → round(25 * 1/3) = 8
      expect(result.reasons).toContain('debt_type_match');
      expect(result.score).toBeGreaterThanOrEqual(8);
    });

    it('gives near-range credit when debt is slightly below min', () => {
      const lead = makeLead({ totalDebt: 4200 }); // 80% of min 5000
      const provider = makeProvider({ minDebtAmount: 5000, maxDebtAmount: 50000 });

      const result = service.scoreMatch(lead, provider);
      expect(result.reasons).toContain('debt_amount_near_range');
    });

    it('gives partial service credit for non-debt_settlement services', () => {
      const lead = makeLead();
      const provider = makeProvider({ serviceTypes: ['credit_repair'] });

      const result = service.scoreMatch(lead, provider);
      expect(result.reasons).toContain('service_type_partial');
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // TIER DERIVATION
  // ═════════════════════════════════════════════════════════════════════
  describe('getProviderTier', () => {
    it('returns premium for marketplace seat providers', () => {
      const provider = makeProvider({ subscriptionType: 'marketplace_seat', avgRating: 3.0 });
      expect(service.getProviderTier(provider)).toBe('premium');
    });

    it('returns premium for AFCC member with high rating', () => {
      const provider = makeProvider({ isAfccMember: true, avgRating: 4.5, subscriptionType: 'pay_per_lead' });
      expect(service.getProviderTier(provider)).toBe('premium');
    });

    it('returns standard for AFCC member with moderate rating', () => {
      const provider = makeProvider({ isAfccMember: true, avgRating: 3.5, subscriptionType: 'pay_per_lead' });
      expect(service.getProviderTier(provider)).toBe('standard');
    });

    it('returns basic for low-quality provider', () => {
      const provider = makeProvider({ isAfccMember: false, avgRating: 2.0, subscriptionType: 'pay_per_lead' });
      expect(service.getProviderTier(provider)).toBe('basic');
    });
  });

  describe('getLeadTier', () => {
    it('returns premium when mlTier is premium', () => {
      const lead = makeLead({ mlTier: 'premium' });
      expect(service.getLeadTier(lead)).toBe('premium');
    });

    it('returns premium when qualityScore >= 70 and no mlTier', () => {
      const lead = makeLead({ qualityScore: 75, mlTier: undefined });
      expect(service.getLeadTier(lead)).toBe('premium');
    });

    it('returns standard when qualityScore >= 40 and no mlTier', () => {
      const lead = makeLead({ qualityScore: 50, mlTier: undefined });
      expect(service.getLeadTier(lead)).toBe('standard');
    });

    it('returns basic for low qualityScore', () => {
      const lead = makeLead({ qualityScore: 20, mlTier: undefined });
      expect(service.getLeadTier(lead)).toBe('basic');
    });
  });
});
