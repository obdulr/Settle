'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025';

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'browse' | 'purchased'>('overview');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    if (parsed.role !== 'provider') {
      router.push('/dashboard');
      return;
    }
    setUser(parsed);
    loadData(token);
  }, []);

  const loadData = async (token: string) => {
    try {
      const [statsRes, availableRes, myLeadsRes] = await Promise.all([
        fetch(`${API_URL}/providers/portal/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/leads/available`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/leads/my-leads`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (availableRes.ok) setLeads(await availableRes.json());
      if (myLeadsRes.ok) setMyLeads(await myLeadsRes.json());
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (leadId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setPurchasing(leadId);
    setError('');
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}/purchase`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Purchase failed');
      }
      await loadData(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasing(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  const DEBT_LABELS: Record<string, string> = {
    credit_card: 'Credit Cards', medical: 'Medical', personal_loan: 'Personal Loans',
    student_loan: 'Student Loans', business: 'Business', other: 'Other',
  };

  const EMPLOYMENT_LABELS: Record<string, string> = {
    employed: 'Full-Time', self_employed: 'Self-Employed', part_time: 'Part-Time',
    unemployed: 'Unemployed', retired: 'Retired', other: 'Other',
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Top bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-black dark:text-white">
              Settle<span className="text-blue-600">InPeace</span>
            </span>
            <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">Provider Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-red-500">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5">
            <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Credit Balance</div>
            <div className="text-2xl font-black text-green-600">${stats?.creditBalance || 0}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5">
            <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Available Leads</div>
            <div className="text-2xl font-black text-blue-600">{leads.length}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5">
            <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Purchased Leads</div>
            <div className="text-2xl font-black text-black dark:text-white">{myLeads.length}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-5">
            <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Accepting Leads</div>
            <div className="text-2xl font-black">{stats?.isAcceptingLeads ? '✓ Yes' : '✗ No'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'browse' as const, label: `Browse Leads (${leads.length})` },
            { id: 'purchased' as const, label: `My Leads (${myLeads.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Welcome back, {user?.email}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-black dark:text-white">Account Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Credit Balance:</span><span className="font-bold text-green-600">${stats?.creditBalance || 0}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Successful Settlements:</span><span className="font-bold">{stats?.successfulSettlements || 0}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Average Rating:</span><span className="font-bold">{stats?.avgRating ? `${stats.avgRating}★` : 'No reviews yet'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Review Count:</span><span className="font-bold">{stats?.reviewCount || 0}</span></div>
                </div>
                <Link href="/portal/billing" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Credits →</Link>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-black dark:text-white">Quick Actions</h3>
                <div className="space-y-2">
                  <button onClick={() => setActiveTab('browse')} className="block w-full text-left px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm">
                    📋 Browse available leads ({leads.length} available)
                  </button>
                  <button onClick={() => setActiveTab('purchased')} className="block w-full text-left px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm">
                    📦 View my purchased leads ({myLeads.length})
                  </button>
                  <Link href="/portal/settings" className="block w-full text-left px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm">
                    ⚙️ Update profile & settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Browse leads tab */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">No leads available right now</h3>
                <p className="text-zinc-500 text-sm">New leads come in as consumers complete assessments. Check back soon.</p>
              </div>
            ) : (
              leads.map(lead => (
                <div key={lead.id} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white px-2 py-1 rounded-full" style={{
                            backgroundColor: lead.qualityScore >= 70 ? '#16a34a' : lead.qualityScore >= 40 ? '#2563eb' : '#a1a1aa'
                          }}>
                            Score: {lead.qualityScore}
                          </span>
                          <span className="text-xs text-zinc-400">{lead.state}</span>
                        </div>
                        <span className="text-xs text-zinc-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><div className="text-zinc-400 text-xs">Debt Amount</div><div className="font-bold text-black dark:text-white">${Number(lead.totalDebt).toLocaleString()}</div></div>
                        <div><div className="text-zinc-400 text-xs">Debt Types</div><div className="font-bold text-black dark:text-white">{lead.debtTypes?.map((t: string) => DEBT_LABELS[t] || t).join(', ')}</div></div>
                        <div><div className="text-zinc-400 text-xs">Employment</div><div className="font-bold text-black dark:text-white">{EMPLOYMENT_LABELS[lead.employmentStatus] || lead.employmentStatus}</div></div>
                        <div><div className="text-zinc-400 text-xs">Monthly Income</div><div className="font-bold text-black dark:text-white">${Number(lead.monthlyIncome).toLocaleString()}/mo</div></div>
                      </div>
                      <div className="mt-3 text-xs text-zinc-400">
                        {lead.monthsBehind > 0 ? `${lead.monthsBehind}+ months behind on payments` : 'Current on payments'}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-xs text-zinc-400 mb-1">Lead Price</div>
                      <div className="text-2xl font-black text-blue-600 mb-3">
                        ${lead.totalDebt >= 50000 ? 300 : lead.totalDebt >= 25000 ? 200 : lead.totalDebt >= 15000 ? 150 : lead.totalDebt >= 10000 ? 100 : 75}
                      </div>
                      <button
                        onClick={() => handlePurchase(lead.id)}
                        disabled={purchasing === lead.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-40"
                      >
                        {purchasing === lead.id ? 'Processing...' : 'Purchase Lead →'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My leads tab */}
        {activeTab === 'purchased' && (
          <div className="space-y-4">
            {myLeads.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-12 text-center">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">No purchased leads yet</h3>
                <p className="text-zinc-500 text-sm mb-4">Browse available leads and purchase to see consumer contact details.</p>
                <button onClick={() => setActiveTab('browse')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Browse Leads →</button>
              </div>
            ) : (
              myLeads.map(lead => (
                <div key={lead.id} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white px-2 py-1 rounded-full bg-green-600">Purchased</span>
                      <span className="text-xs text-zinc-400">${lead.salePrice} · {new Date(lead.purchasedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold text-black dark:text-white text-lg mb-2">{lead.firstName} {lead.lastName}</h3>
                      <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                        <div>📧 {lead.email}</div>
                        <div>📱 {lead.phone}</div>
                        <div>📍 {lead.state} {lead.zipCode}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><div className="text-zinc-400 text-xs">Debt Amount</div><div className="font-bold">${Number(lead.totalDebt).toLocaleString()}</div></div>
                      <div><div className="text-zinc-400 text-xs">Debt Types</div><div className="font-bold">{lead.debtTypes?.map((t: string) => DEBT_LABELS[t] || t).join(', ')}</div></div>
                      <div><div className="text-zinc-400 text-xs">Employment</div><div className="font-bold">{EMPLOYMENT_LABELS[lead.employmentStatus] || lead.employmentStatus}</div></div>
                      <div><div className="text-zinc-400 text-xs">Income</div><div className="font-bold">${Number(lead.monthlyIncome).toLocaleString()}/mo</div></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
