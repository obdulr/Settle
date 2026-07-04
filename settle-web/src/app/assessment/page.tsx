'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = [
  'debt_amount',
  'debt_types',
  'months_behind',
  'employment',
  'income',
  'contact',
  'consent',
];

const DEBT_TYPE_OPTIONS = [
  { value: 'credit_card', label: 'Credit Cards' },
  { value: 'medical', label: 'Medical Bills' },
  { value: 'personal_loan', label: 'Personal Loans' },
  { value: 'student_loan', label: 'Student Loans' },
  { value: 'business', label: 'Business Debt' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    totalDebt: '',
    debtTypes: [] as string[],
    monthsBehind: '',
    employmentStatus: '',
    monthlyIncome: '',
    creditScore: '',
    hasFiledBankruptcy: false,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    zipCode: '',
    tcpaConsent: false,
  });

  const currentStep = STEPS[step];
  const progress = Math.round(((step) / STEPS.length) * 100);

  const toggleDebtType = (type: string) => {
    setForm(f => ({
      ...f,
      debtTypes: f.debtTypes.includes(type)
        ? f.debtTypes.filter(t => t !== type)
        : [...f.debtTypes, type],
    }));
  };

  const canAdvance = () => {
    if (currentStep === 'debt_amount') return Number(form.totalDebt) >= 1000;
    if (currentStep === 'debt_types') return form.debtTypes.length > 0;
    if (currentStep === 'months_behind') return form.monthsBehind !== '';
    if (currentStep === 'employment') return form.employmentStatus !== '';
    if (currentStep === 'income') return form.monthlyIncome !== '';
    if (currentStep === 'contact') return form.firstName && form.lastName && form.email && form.phone && form.state;
    if (currentStep === 'consent') return form.tcpaConsent;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025'}/leads/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalDebt: parseFloat(form.totalDebt),
          monthsBehind: parseInt(form.monthsBehind) || 0,
          monthlyIncome: parseFloat(form.monthlyIncome) || 0,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-zinc-900 dark:to-black flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white mb-4">You're on your way to peace.</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-lg">
            We've matched your profile with qualified debt relief providers. Check your options now.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/compare')}
              className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-lg"
            >
              See My Provider Matches →
            </button>
            <button
              onClick={() => router.push('/register')}
              className="block w-full py-3 px-6 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Create an account to track your progress
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-zinc-900 dark:to-black px-4 py-12">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide mb-2">Free Debt Assessment</p>
          <h1 className="text-3xl font-bold text-black dark:text-white">Find your path to financial peace</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">2 minutes · No credit check · No obligation</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8">

          {/* Step 1: Debt Amount */}
          {currentStep === 'debt_amount' && (
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">How much do you owe in total?</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">Include all unsecured debts combined.</p>
              <div className="space-y-3">
                {[
                  { label: 'Under $7,500', value: '5000' },
                  { label: '$7,500 – $15,000', value: '10000' },
                  { label: '$15,000 – $25,000', value: '20000' },
                  { label: '$25,000 – $50,000', value: '35000' },
                  { label: '$50,000 – $100,000', value: '75000' },
                  { label: 'Over $100,000', value: '125000' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, totalDebt: opt.value }))}
                    className={`w-full py-3 px-5 rounded-lg border-2 text-left font-medium transition-all ${
                      form.totalDebt === opt.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Debt Types */}
          {currentStep === 'debt_types' && (
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">What types of debt do you have?</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-3">
                {DEBT_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleDebtType(opt.value)}
                    className={`py-3 px-4 rounded-lg border-2 text-center font-medium transition-all ${
                      form.debtTypes.includes(opt.value)
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Months Behind */}
          {currentStep === 'months_behind' && (
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">How far behind are you on payments?</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">On your most delinquent account.</p>
              <div className="space-y-3">
                {[
                  { label: "I'm current on all payments", value: '0' },
                  { label: '1–2 months behind', value: '1' },
                  { label: '3–5 months behind', value: '3' },
                  { label: '6+ months behind', value: '6' },
                  { label: 'In collections', value: '12' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, monthsBehind: opt.value }))}
                    className={`w-full py-3 px-5 rounded-lg border-2 text-left font-medium transition-all ${
                      form.monthsBehind === opt.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Employment */}
          {currentStep === 'employment' && (
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">What is your current employment status?</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">This helps match you with the right programs.</p>
              <div className="space-y-3">
                {[
                  { label: 'Employed full-time', value: 'employed' },
                  { label: 'Self-employed / Freelance', value: 'self_employed' },
                  { label: 'Part-time / Gig work', value: 'part_time' },
                  { label: 'Unemployed', value: 'unemployed' },
                  { label: 'Retired', value: 'retired' },
                  { label: 'Disability / Other', value: 'other' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, employmentStatus: opt.value }))}
                    className={`w-full py-3 px-5 rounded-lg border-2 text-left font-medium transition-all ${
                      form.employmentStatus === opt.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Income */}
          {currentStep === 'income' && (
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">What is your approximate monthly income?</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">Before taxes, from all sources.</p>
              <div className="space-y-3">
                {[
                  { label: 'Under $2,000/month', value: '1500' },
                  { label: '$2,000 – $3,500/month', value: '2750' },
                  { label: '$3,500 – $5,000/month', value: '4250' },
                  { label: '$5,000 – $8,000/month', value: '6500' },
                  { label: 'Over $8,000/month', value: '10000' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, monthlyIncome: opt.value }))}
                    className={`w-full py-3 px-5 rounded-lg border-2 text-left font-medium transition-all ${
                      form.monthlyIncome === opt.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Contact Info */}
          {currentStep === 'contact' && (
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Where should we send your matches?</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">Your information is private and never sold.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">First Name</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">State</label>
                    <select
                      value={form.state}
                      onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select state</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={form.zipCode}
                      onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))}
                      maxLength={5}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Consent */}
          {currentStep === 'consent' && (
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Almost done — one last step</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">Please review and agree to connect with providers.</p>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-6 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                <p><strong>Your information summary:</strong></p>
                <p>Total Debt: <strong>${Number(form.totalDebt).toLocaleString()}</strong></p>
                <p>Debt Types: <strong>{form.debtTypes.join(', ') || '—'}</strong></p>
                <p>Employment: <strong>{form.employmentStatus}</strong></p>
                <p>State: <strong>{form.state}</strong></p>
              </div>
              <label className="flex gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tcpaConsent}
                  onChange={e => setForm(f => ({ ...f, tcpaConsent: e.target.checked }))}
                  className="mt-1 w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  I agree to be contacted by Settle In Peace and its partner debt relief providers by phone, email, or text message regarding my debt situation. I understand this constitutes a TCPA-compliant opt-in. Standard message and data rates may apply.
                </span>
              </label>
              {error && (
                <p className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 px-6 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canAdvance() || submitting}
                className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'See My Options →'}
              </button>
            )}
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-6 flex justify-center gap-6 text-xs text-zinc-400 dark:text-zinc-600">
          <span>🔒 Secure & Private</span>
          <span>✓ No Credit Check</span>
          <span>✓ No Obligation</span>
          <span>✓ 100% Free</span>
        </div>
      </div>
    </div>
  );
}