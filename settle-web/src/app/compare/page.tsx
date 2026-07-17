'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ComplianceDisclosure from '../../components/ComplianceDisclosure';

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
  // Matching fields (present when fetched via /matching/recommended/:leadId)
  matchScore?: number;
  matchReasons?: string[];
}

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
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-zinc-500">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const isMatched = !!leadId;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'fee' | 'savings' | 'match'>('match');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!sortBy) return;
    if (isMatched && sortBy === 'rating') setSortBy('match');
  }, [isMatched, sortBy]);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025';
        let data: Provider[];
        if (leadId) {
          const res = await fetch(`${base}/matching/recommended/${leadId}`);
          if (!res.ok) throw new Error('Failed to load matched providers');
          data = await res.json();
        } else {
          const res = await fetch(`${base}/providers`);
          if (!res.ok) throw new Error('Failed to load providers');
          data = await res.json();
        }
        setProviders(data);
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, [leadId]);

  const handleRequestContact = async (providerId: string) => {
    if (!leadId) return;
    setRequesting(providerId);
    setActionError('');
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025';
      const res = await fetch(`${base}/matching/request-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, providerId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to request contact');
      }
      setRequestedIds(prev => new Set(prev).add(providerId));
    } catch (err: any) {
      setActionError(err.message || 'Something went wrong');
    } finally {
      setRequesting(null);
    }
  };

  const sorted = [...providers].sort((a, b) => {
    if (sortBy === 'match') return (b.matchScore || 0) - (a.matchScore || 0);
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
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide mb-2">
            {isMatched ? 'Personalized For You' : 'Side-by-Side Comparison'}
          </p>
          <h1 className="text-4xl font-bold text-black dark:text-white">
            {isMatched ? 'Providers Matched to Your Profile' : 'Compare Debt Relief Providers'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-lg max-w-2xl mx-auto">
            {isMatched
              ? "Based on your assessment, here are the providers most likely to help your situation — ranked by match score."
              : 'Transparent fees, real ratings, and verified success rates — so you choose with confidence.'}
          </p>
        </div>

        {/* Differentiator callout */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8 text-center">
          <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
            {isMatched
              ? '🎯 These providers serve your state, handle your debt types, and accept your debt amount — request contact with the ones you like.'
              : '💡 Unlike other sites, we show you real fees upfront. No hidden costs. No bait-and-switch.'}
          </p>
        </div>

        {actionError && (
          <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 text-sm">
            {actionError}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20 text-zinc-500">Loading providers...</div>
        )}

        {/* Empty state — no providers yet */}
        {!loading && providers.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-12 text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-3">
              Our provider network is being built
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mb-8">
              We're currently onboarding vetted debt relief providers. In the meantime, you can take the free assessment — we'll notify you as soon as providers are available to match with your profile.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/assessment"
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                Take the Free Assessment →
              </Link>
              <Link
                href="/providers"
                className="px-8 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
              >
                I'm a Provider — Join the Network
              </Link>
            </div>

            {/* What you'll see when providers join */}
            <div className="mt-12 text-left">
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4 text-center">
                Here's what the comparison will look like once providers join:
              </h3>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <div className="bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-center py-2">
                  Illustrative example — not real data
                </div>
                <div className="grid grid-cols-4 bg-blue-600 text-white text-sm font-semibold">
                  <div className="p-4">Provider</div>
                  <div className="p-4 text-center">Fee</div>
                  <div className="p-4 text-center">Avg. Savings</div>
                  <div className="p-4 text-center">Timeline</div>
                </div>
                {[
                  { name: 'Provider A', fee: '15%', savings: '50%', timeline: '24 mo' },
                  { name: 'Provider B', fee: '18%', savings: '45%', timeline: '22 mo' },
                  { name: 'Provider C', fee: '20%', savings: '38%', timeline: '26 mo' },
                ].map(p => (
                  <div key={p.name} className="grid grid-cols-4 border-t border-zinc-100 dark:border-zinc-800 text-sm">
                    <div className="p-4 font-semibold text-black dark:text-white">{p.name}</div>
                    <div className="p-4 text-center font-bold text-blue-600 dark:text-blue-400">{p.fee}</div>
                    <div className="p-4 text-center font-bold text-green-600 dark:text-green-400">{p.savings}</div>
                    <div className="p-4 text-center text-zinc-600 dark:text-zinc-400">{p.timeline}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Provider cards — shown when providers exist */}
        {!loading && providers.length > 0 && (
          <>
            {/* Sort controls */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Sort by:</span>
              {([
                ...(isMatched ? [{ id: 'match' as const, label: 'Best Match' }] : []),
                { id: 'rating' as const, label: 'Highest Rated' },
                { id: 'fee' as const, label: 'Lowest Fee' },
                { id: 'savings' as const, label: 'Most Savings' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    sortBy === opt.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {sorted.map((p, index) => (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-md overflow-hidden border-2 ${
                    index === 0 && isMatched ? 'border-green-500' : index === 0 ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  {index === 0 && (
                    <div className={`text-white text-center text-xs font-semibold py-1.5 tracking-wide ${isMatched ? 'bg-green-600' : 'bg-blue-600'}`}>
                      {isMatched ? `BEST MATCH — ${p.matchScore}% Match` : 'BEST MATCH — Highest Rated'}
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">

                      {/* Company info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h2 className="text-xl font-bold text-black dark:text-white">{p.companyName}</h2>
                              {isMatched && typeof p.matchScore === 'number' && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-white px-2.5 py-1 rounded-full bg-green-600">
                                  {p.matchScore}% Match
                                </span>
                              )}
                            </div>
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
                            <div className="text-center flex-shrink-0">
                              <div className="text-2xl font-black text-green-600">{p.bbbRating}</div>
                              <div className="text-xs text-zinc-500">BBB Rating</div>
                            </div>
                          )}
                        </div>

                        {p.description && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">{p.description}</p>
                        )}

                        {/* Match reasons */}
                        {isMatched && p.matchReasons && p.matchReasons.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {p.matchReasons.map((reason, i) => (
                              <span key={i} className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full font-medium border border-green-200 dark:border-green-800">
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Key stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                          {p.feePercentage && (
                            <div>
                              <div className="text-xs text-zinc-500">Fee</div>
                              <div className="text-lg font-bold text-blue-600">{p.feePercentage}%</div>
                            </div>
                          )}
                          {p.avgSavingsPercentage && (
                            <div>
                              <div className="text-xs text-zinc-500">Avg. Savings</div>
                              <div className="text-lg font-bold text-green-600">{p.avgSavingsPercentage}%</div>
                            </div>
                          )}
                          {p.avgSettlementDays && (
                            <div>
                              <div className="text-xs text-zinc-500">Timeline</div>
                              <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                {Math.round(p.avgSettlementDays / 30)} mo
                              </div>
                            </div>
                          )}
                          {p.yearsInBusiness && (
                            <div>
                              <div className="text-xs text-zinc-500">In Business</div>
                              <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                {p.yearsInBusiness} yrs
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Certifications */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {p.isAfccMember && (
                            <span className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                              AFCC Member
                            </span>
                          )}
                          {p.isIapdaMember && (
                            <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                              IAPDA Certified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="md:w-48 flex flex-col gap-2">
                        <div className="text-center md:text-left">
                          <div className="text-xs text-zinc-500">Min. Debt</div>
                          <div className="text-lg font-bold text-black dark:text-white">
                            ${p.minDebtAmount.toLocaleString()}
                          </div>
                        </div>
                        {isMatched && (
                          <button
                            onClick={() => handleRequestContact(p.id)}
                            disabled={requesting === p.id || requestedIds.has(p.id)}
                            className={`block w-full py-2.5 px-4 text-center text-sm font-bold rounded-lg transition-all ${
                              requestedIds.has(p.id)
                                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800'
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                            }`}
                          >
                            {requestedIds.has(p.id)
                              ? '✓ Contact Requested'
                              : requesting === p.id
                              ? 'Requesting...'
                              : 'Request Contact →'}
                          </button>
                        )}
                        {p.website && (
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-2.5 px-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 text-center text-sm font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                          >
                            Visit Website →
                          </a>
                        )}
                        {!isMatched && (
                          <Link
                            href="/assessment"
                            className="block w-full py-2.5 px-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 text-center text-sm font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                          >
                            Check If I Qualify
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Compliance disclosures */}
        <div className="mt-12">
          <ComplianceDisclosure />
        </div>
      </div>
    </div>
  );
}
