'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/authUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025';

interface SalesLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  totalDebt: number;
  debtTypes?: string[];
  status: string;
  qualityScore?: number;
  salesNotes?: string;
  createdAt?: string;
}

const DEBT_LABELS: Record<string, string> = {
  credit_card: 'Credit Cards', medical: 'Medical', personal_loan: 'Personal Loans',
  student_loan: 'Student Loans', business: 'Business', other: 'Other',
};

const STATUS_OPTIONS = ['new', 'contacted', 'interested', 'converted', 'rejected'];

export default function SalesDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const parsed = getStoredUser();
    if (!token || !parsed) {
      router.push('/login');
      return;
    }
    if (parsed.role !== 'sales') {
      router.push('/dashboard');
      return;
    }
    setUser(parsed);
    loadData(token);
  }, [router]);

  const loadData = async (token: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [leadsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/sales/leads`, { headers }).catch(() => null),
        fetch(`${API_URL}/sales/leads/stats`, { headers }).catch(() => null),
      ]);
      if (leadsRes?.ok) setLeads(await leadsRes.json());
      if (statsRes?.ok) setStats(await statsRes.json());
    } catch {
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = getStoredToken();
    if (!token || !selectedLead) return;
    setSaving(true);
    try {
      if (status && status !== selectedLead.status) {
        const res = await fetch(`${API_URL}/sales/leads/${selectedLead.id}/status`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes }),
        });
        if (!res.ok) throw new Error('Failed to update status');
      } else if (notes.trim()) {
        const res = await fetch(`${API_URL}/sales/leads/${selectedLead.id}/notes`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });
        if (!res.ok) throw new Error('Failed to save notes');
      }
      setSelectedLead(null);
      setNotes('');
      setStatus('');
      await loadData(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-500">Loading your leads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Top bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-black dark:text-white">Settle<span className="text-blue-600">InPeace</span></span>
            <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">Sales Agent</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 hidden sm:block">{user?.email}</span>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-800 p-5">
            <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">My Leads</div>
            <div className="text-2xl font-black text-black dark:text-white">{stats?.total ?? leads.length}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-800 p-5">
            <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">New</div>
            <div className="text-2xl font-black text-blue-600">{stats?.new ?? leads.filter(l => l.status === 'new').length}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-800 p-5">
            <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Converted</div>
            <div className="text-2xl font-black text-green-600">{stats?.converted ?? leads.filter(l => l.status === 'converted').length}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-800 p-5">
            <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Conversion Rate</div>
            <div className="text-2xl font-black text-purple-600">{stats?.conversionRate ?? 0}%</div>
          </div>
        </div>

        {/* Leads table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left p-4">Lead</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">State</th>
                <th className="text-right p-4">Debt</th>
                <th className="text-right p-4">Quality</th>
                <th className="text-right p-4">Date</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">No leads assigned yet.</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="p-4">
                    <div className="font-semibold text-black dark:text-white">{l.firstName} {l.lastName}</div>
                    <div className="text-xs text-zinc-400">{l.email} · {l.phone}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">{l.status}</span>
                  </td>
                  <td className="p-4 text-black dark:text-white">{l.state}</td>
                  <td className="p-4 text-right font-bold text-black dark:text-white">${Number(l.totalDebt).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    {typeof l.qualityScore === 'number' ? (
                      <span className="font-bold" style={{ color: l.qualityScore >= 70 ? '#16a34a' : l.qualityScore >= 40 ? '#2563eb' : '#a1a1aa' }}>{l.qualityScore}</span>
                    ) : '—'}
                  </td>
                  <td className="p-4 text-right text-zinc-500">{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => { setSelectedLead(l); setStatus(l.status); setNotes(''); }}
                      className="px-3 py-1.5 text-xs font-bold border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead detail modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-xl p-6">
              <h2 className="text-xl font-bold text-black dark:text-white mb-2">{selectedLead.firstName} {selectedLead.lastName}</h2>
              <div className="text-sm text-zinc-500 mb-4">
                {selectedLead.email} · {selectedLead.phone} · {selectedLead.state}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-zinc-500">Debt:</span>{' '}
                  <span className="font-bold text-black dark:text-white">${Number(selectedLead.totalDebt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Types:</span>{' '}
                  <span className="text-black dark:text-white">{selectedLead.debtTypes?.map(t => DEBT_LABELS[t] || t).join(', ') || '—'}</span>
                </div>
              </div>

              {selectedLead.salesNotes && (
                <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedLead.salesNotes}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Update Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-white"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-white"
                    placeholder="Add a note..."
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (!status && !notes.trim())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
