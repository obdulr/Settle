'use client';

import { useState } from 'react';

const PLANS = [
  {
    id: 'pay_per_lead',
    name: 'Pay Per Lead',
    price: 'From $75/lead',
    description: 'Buy only the leads you want. No minimums, pause anytime.',
    features: [
      'Pre-qualified consumer leads',
      'Leads scored by debt amount & urgency',
      'State and debt-type filtering',
      'Real-time lead delivery',
      'No monthly commitment',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'marketplace_seat',
    name: 'Marketplace Seat',
    price: '$1,500/month',
    description: 'Listed on the comparison page + priority lead access.',
    features: [
      'Everything in Pay Per Lead',
      'Company profile on /compare page',
      'Priority placement in consumer results',
      '20% discount on all lead purchases',
      'Logo and description in marketplace',
      'Dedicated account manager',
    ],
    cta: 'Apply for a Seat',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom pricing',
    description: 'High-volume API access, custom integrations, and white-glove service.',
    features: [
      'Everything in Marketplace Seat',
      'API / ping-post integration',
      'Custom lead volume agreements',
      'Exclusive geographic territories',
      'Co-branded landing pages',
      'Real-time bidding access',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function ProvidersPage() {
  const [formStep, setFormStep] = useState<'plans' | 'signup' | 'success'>('plans');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    phone: '',
    website: '',
    description: '',
    minDebtAmount: '7500',
    feePercentage: '',
    yearsInBusiness: '',
    bbbRating: '',
    isAfccMember: false,
    isIapdaMember: false,
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    if (planId === 'enterprise') {
      window.open('mailto:partners@settleinpeace.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }
    setFormStep('signup');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025'}/providers/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subscriptionType: selectedPlan,
          minDebtAmount: parseFloat(form.minDebtAmount),
          feePercentage: form.feePercentage ? parseFloat(form.feePercentage) : undefined,
          yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Signup failed');
      }
      setFormStep('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (formStep === 'success') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white mb-4">Application Received!</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-6">
            Our team will review your application and reach out within 1–2 business days to activate your account.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Questions? Email us at <a href="mailto:partners@settleinpeace.com" className="text-blue-500 hover:underline">partners@settleinpeace.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        {formStep === 'plans' && (
          <>
            {/* Hero */}
            <div className="text-center mb-14">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide mb-3">For Debt Relief Companies</p>
              <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-4">
                Access the most qualified<br />debt relief leads in the market.
              </h1>
              <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                Our consumers self-qualify through a detailed 7-step assessment before you ever speak to them. Higher intent. Better conversions. Lower waste.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {[
                { value: '$22,000', label: 'Avg consumer debt' },
                { value: '68%', label: 'Qualify for settlement' },
                { value: '3.2x', label: 'Avg conversion vs cold leads' },
                { value: '100%', label: 'TCPA compliant' },
              ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-xl shadow p-5 text-center">
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{stat.value}</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Plans */}
            <h2 className="text-2xl font-bold text-black dark:text-white text-center mb-8">Choose your access plan</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-7 flex flex-col ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white shadow-xl scale-[1.02]'
                      : 'bg-white dark:bg-zinc-900 shadow-md'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3">Most Popular</div>
                  )}
                  <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-black dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  <div className={`text-2xl font-black mb-2 ${plan.highlighted ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                    {plan.price}
                  </div>
                  <p className={`text-sm mb-5 ${plan.highlighted ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {plan.description}
                  </p>
                  <ul className="space-y-2 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className={`flex gap-2 text-sm ${plan.highlighted ? 'text-blue-50' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        <span className={plan.highlighted ? 'text-blue-200' : 'text-green-500'}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      plan.highlighted
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-8 mb-10">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">How it works</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: '1', title: 'Consumer takes assessment', desc: 'They complete our 7-step debt profile quiz with full TCPA consent.' },
                  { step: '2', title: 'Lead is scored', desc: 'Our algorithm scores each lead 0–100 based on debt amount, urgency, and income.' },
                  { step: '3', title: 'You choose', desc: 'Browse available leads filtered by state, debt type, and score. Buy what you want.' },
                  { step: '4', title: 'You get the contact', desc: "Full consumer details delivered instantly. You only pay when you accept a lead." },
                ].map(item => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-black dark:text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
              <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3">Provider requirements</h3>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                <li>✓ Active state licensing for debt settlement or consolidation</li>
                <li>✓ BBB rating of B or above</li>
                <li>✓ AFCC or IAPDA membership preferred</li>
                <li>✓ No upfront fees charged to consumers</li>
                <li>✓ FTC Telemarketing Sales Rule compliant</li>
              </ul>
            </div>
          </>
        )}

        {/* Signup Form */}
        {formStep === 'signup' && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setFormStep('plans')}
              className="text-blue-600 dark:text-blue-400 text-sm mb-6 hover:underline"
            >
              ← Back to plans
            </button>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Create your provider account</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">
                Plan: <strong>{PLANS.find(p => p.id === selectedPlan)?.name}</strong> · Your account will be reviewed before activation (1–2 business days).
              </p>

              {error && (
                <div className="mb-5 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Company Name *</label>
                  <input
                    type="text" required value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Business Email *</label>
                    <input
                      type="email" required value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone *</label>
                    <input
                      type="tel" required value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password *</label>
                  <input
                    type="password" required minLength={8} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Website</label>
                    <input
                      type="url" value={form.website}
                      onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">BBB Rating</label>
                    <select
                      value={form.bbbRating}
                      onChange={e => setForm(f => ({ ...f, bbbRating: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select...</option>
                      {['A+','A','A-','B+','B','B-'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Min Debt ($)</label>
                    <input
                      type="number" value={form.minDebtAmount}
                      onChange={e => setForm(f => ({ ...f, minDebtAmount: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fee % of Debt</label>
                    <input
                      type="number" step="0.1" value={form.feePercentage}
                      onChange={e => setForm(f => ({ ...f, feePercentage: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Years in Business</label>
                    <input
                      type="number" value={form.yearsInBusiness}
                      onChange={e => setForm(f => ({ ...f, yearsInBusiness: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Company Description</label>
                  <textarea
                    rows={3} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    <input type="checkbox" checked={form.isAfccMember} onChange={e => setForm(f => ({ ...f, isAfccMember: e.target.checked }))} className="accent-blue-600" />
                    AFCC Member
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                    <input type="checkbox" checked={form.isIapdaMember} onChange={e => setForm(f => ({ ...f, isIapdaMember: e.target.checked }))} className="accent-blue-600" />
                    IAPDA Member
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application →'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}