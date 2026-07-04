'use client';

import { useEffect, useState } from 'react';

interface Provider {
  id: string;
  companyName: string;
  description?: string;
  logoUrl?: string;
  serviceTypes?: string[];
  debtTypes?: string[];
  statesServed?: string[];
  minDebtAmount: number;
  feePercentage?: number;
  bbbRating?: string;
  avgRating?: number;
  reviewCount: number;
  successfulSettlements: number;
  avgSettlementDays?: number;
  avgSavingsPercentage?: number;
  isAfccMember: boolean;
  isIapdaMember: boolean;
  yearsInBusiness?: number;
  website?: string;
}

// Placeholder data until real providers sign up
const PLACEHOLDER_PROVIDERS: Provider[] = [
  {
    id: '1',
    companyName: 'Freedom Debt Relief',
    description: 'One of the largest debt settlement companies in the US, with over 850,000 clients helped.',
    serviceTypes: ['debt_settlement'],
    debtTypes: ['credit_card', 'medical', 'personal_loan'],
    statesServed: ['CA','TX','FL','NY','IL','PA','OH','GA','NC','MI'],
    minDebtAmount: 7500,
    feePercentage: 18,
    bbbRating: 'A+',
    avgRating: 4.5,
    reviewCount: 28000,
    successfulSettlements: 850000,
    avgSettlementDays: 730,
    avgSavingsPercentage: 45,
    isAfccMember: true,
    isIapdaMember: true,
    yearsInBusiness: 22,
    website: 'https://freedomdebtrelief.com',
  },
  {
    id: '2',
    companyName: 'Pacific Debt Relief',
    description: 'Boutique firm with personalized service, known for high client satisfaction and low fees.',
    serviceTypes: ['debt_settlement'],
    debtTypes: ['credit_card', 'medical', 'personal_loan', 'business'],
    statesServed: ['CA','TX','FL','NY','AZ','NV','WA','OR'],
    minDebtAmount: 10000,
    feePercentage: 15,
    bbbRating: 'A+',
    avgRating: 4.8,
    reviewCount: 4200,
    successfulSettlements: 35000,
    avgSettlementDays: 660,
    avgSavingsPercentage: 52,
    isAfccMember: true,
    isIapdaMember: false,
    yearsInBusiness: 18,
    website: 'https://pacificdebt.com',
  },
  {
    id: '3',
    companyName: 'ClearOne Advantage',
    description: 'Transparent pricing, no hidden fees, and a dedicated account manager for every client.',
    serviceTypes: ['debt_settlement', 'debt_consolidation'],
    debtTypes: ['credit_card', 'medical', 'personal_loan'],
    statesServed: ['AL','AZ','AR','CA','CO','FL','GA','ID','IL','IN','KS','KY','LA','MD'],
    minDebtAmount: 7500,
    feePercentage: 20,
    bbbRating: 'A',
    avgRating: 4.3,
    reviewCount: 9800,
    successfulSettlements: 75000,
    avgSettlementDays: 780,
    avgSavingsPercentage: 38,
    isAfccMember: true,
    isIapdaMember: true,
    yearsInBusiness: 15,
    website: 'https://clearoneadvantage.com',
  },
];

const STARS = (rating?: number) => {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-sm ${i < full ? 'text-yellow-400' : (i === full && half) ? 'text-yellow-300' : 'text-zinc-300 dark:text-zinc-600'}`}>
          ★
        </span>
      ))}
    </span>
  );
};

export default function ComparePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'fee' | 'savings'>('rating');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025'}/providers`);
        const data = await res.json();
        setProviders(data.length > 0 ? data : PLACEHOLDER_PROVIDERS);
      } catch {
        // Use placeholder data when API isn't connected yet
        setProviders(PLACEHOLDER_PROVIDERS);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  const sorted = [...providers].sort((a, b) => {
    if (sortBy === 'rating') return (b.avgRating || 0) - (a.avgRating || 0);
    if (sortBy === 'fee') return (a.feePercentage || 99) - (b.feePercentage || 99);
    if (sortBy === 'savings') return (b.avgSavingsPercentage || 0) - (a.avgSavingsPercentage || 0);
    return 0;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide mb-2">Side-by-Side Comparison</p>
          <h1 className="text-4xl font-bold text-black dark:text-white">Compare Debt Relief Providers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-lg max-w-2xl mx-auto">
            Transparent fees, real ratings, and verified success rates — so you choose with confidence.
          </p>
        </div>

        {/* Differentiator callout */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8 text-center">
          <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
            💡 Unlike other sites, we show you real fees upfront. No hidden costs. No bait-and-switch.
          </p>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Sort by:</span>
          {(['rating', 'fee', 'savings'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                sortBy === opt
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400'
              }`}
            >
              {opt === 'rating' ? 'Highest Rated' : opt === 'fee' ? 'Lowest Fee' : 'Most Savings'}
            </button>
          ))}
        </div>

        {/* Provider cards */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Loading providers...</div>
        ) : (
          <div className="space-y-6">
            {sorted.map((p, index) => (
              <div
                key={p.id}
                className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-md overflow-hidden border-2 ${
                  index === 0 ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                {index === 0 && (
                  <div className="bg-blue-600 text-white text-center text-xs font-semibold py-1.5 tracking-wide">
                    BEST MATCH — Highest Rated
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">

                    {/* Company info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-black dark:text-white">{p.companyName}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            {p.avgRating && (
                              <>
                                {STARS(p.avgRating)}
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                  {p.avgRating} ({p.reviewCount?.toLocaleString()} reviews)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {p.bbbRating && (
                          <div className="text-center">
                            <div className="text-2xl font-black text-green-600">{p.bbbRating}</div>
                            <div className="text-xs text-zinc-500">BBB Rating</div>
                          </div>
                        )}
                      </div>

                      {p.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">{p.description}</p>
                      )}

                      {/* Certifications */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {p.isAfccMember && (
                          <span className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
                            ✓ AFCC Member
                          </span>
                        )}
                        {p.isIapdaMember && (
                          <span className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
                            ✓ IAPDA Member
                          </span>
                        )}
                        {p.yearsInBusiness && (
                          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-full">
                            {p.yearsInBusiness} years in business
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:min-w-[420px]">
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          {p.feePercentage ? `${p.feePercentage}%` : 'Varies'}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">Service Fee</div>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-green-600 dark:text-green-400">
                          {p.avgSavingsPercentage ? `${p.avgSavingsPercentage}%` : '—'}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">Avg Savings</div>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-zinc-700 dark:text-zinc-300">
                          {p.avgSettlementDays ? `${Math.round(p.avgSettlementDays / 30)}mo` : '—'}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">Avg Timeline</div>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-zinc-700 dark:text-zinc-300">
                          ${p.minDebtAmount?.toLocaleString()}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">Min Debt</div>
                      </div>
                    </div>
                  </div>

                  {/* What they handle */}
                  {p.debtTypes && p.debtTypes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-zinc-500 font-medium">Handles:</span>
                      {p.debtTypes.map(t => (
                        <span key={t} className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-5 flex gap-3">
                    <a
                      href="/assessment"
                      className="flex-1 py-2.5 px-5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-center text-sm"
                    >
                      Get Matched with {p.companyName.split(' ')[0]} →
                    </a>
                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
                      >
                        Visit Site
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom disclaimer */}
        <div className="mt-10 text-center text-xs text-zinc-400 dark:text-zinc-600 max-w-2xl mx-auto">
          <p>
            Settle In Peace receives compensation from partner providers. This may affect which providers are featured and their order. All fees, ratings, and statistics are disclosed transparently. Debt settlement may negatively impact your credit score. Forgiven debt may be taxable. Results vary.
          </p>
          <p className="mt-2">
            Not yet a partner?{' '}
            <a href="/providers" className="text-blue-500 hover:underline">Apply to list your company →</a>
          </p>
        </div>
      </div>
    </div>
  );
}