'use client';

import { useEffect, useMemo, useState } from 'react';
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
  credit_card: 'Credit Cards',
  medical: 'Medical',
  personal_loan: 'Personal Loans',
  student_loan: 'Student Loans',
  business: 'Business',
  other: 'Other',
};

const STATUS_OPTIONS = ['new', 'contacted', 'interested', 'converted', 'rejected'];

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  converted: 'Converted',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  interested: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const PIPELINE_COLORS: Record<string, string> = {
  new: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30',
  contacted: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30',
  interested: 'border-purple-400 bg-purple-50 dark:bg-purple-950/30',
  converted: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
  rejected: 'border-red-400 bg-red-50 dark:bg-red-950/30',
};

function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
}

function formatDate(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseActivities(notes?: string) {
  if (!notes) return [];
  return notes
    .split(/\n?---+\n?/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => {
      const match = block.match(/^\[?([^\]]+)\]?\s*([\s\S]*)$/);
      if (match) {
        return { date: match[1].trim(), text: match[2].trim() };
      }
      return { date: '', text: block };
    })
    .reverse();
}

interface SalesCRMDashboardProps {
  initialUser?: any;
}

export default function SalesCRMDashboard({ initialUser }: SalesCRMDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [view, setView] = useState<'list' | 'pipeline'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'debt' | 'quality'>('newest');

  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'activity'>('overview');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const parsed = initialUser ?? getStoredUser();
    // If initialUser is provided (from dashboard), trust it — don't redirect.
    // Only redirect to login if we have no token and no user at all.
    if (!token) {
      router.push('/login');
      return;
    }
    if (!parsed) {
      router.push('/login');
      return;
    }
    setUser(parsed);
    loadData(token);
  }, [router, initialUser]);

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

  const filteredLeads = useMemo(() => {
    let out = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (l) =>
          l.firstName?.toLowerCase().includes(q) ||
          l.lastName?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.state?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) out = out.filter((l) => l.status === statusFilter);
    if (sortBy === 'newest') out.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    if (sortBy === 'debt') out.sort((a, b) => Number(b.totalDebt || 0) - Number(a.totalDebt || 0));
    if (sortBy === 'quality') out.sort((a, b) => Number(b.qualityScore || 0) - Number(a.qualityScore || 0));
    return out;
  }, [leads, search, statusFilter, sortBy]);

  const pipelineCounts = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<string, SalesLead[]>>((acc, s) => {
      acc[s] = filteredLeads.filter((l) => l.status === s);
      return acc;
    }, {});
  }, [filteredLeads]);

  const handleSave = async () => {
    const token = getStoredToken();
    if (!token || !selectedLead) return;
    setSaving(true);
    try {
      if (status && status !== selectedLead.status) {
        const res = await fetch(`${API_URL}/sales/leads/${selectedLead.id}/status`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes: notes.trim() ? notes : undefined }),
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

  const openLead = (lead: SalesLead) => {
    setSelectedLead(lead);
    setStatus(lead.status);
    setNotes('');
    setDetailTab('overview');
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-500">Loading your CRM...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">Sales CRM</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back, {user?.firstName || user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">Sales Agent</span>
            <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-red-500">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'My Leads', value: stats?.total ?? leads.length, color: 'text-black dark:text-white' },
            { label: 'New', value: stats?.new ?? leads.filter((l) => l.status === 'new').length, color: 'text-blue-600' },
            { label: 'Contacted', value: leads.filter((l) => l.status === 'contacted').length, color: 'text-amber-600' },
            { label: 'Converted', value: stats?.converted ?? leads.filter((l) => l.status === 'converted').length, color: 'text-emerald-600' },
            { label: 'Conversion Rate', value: `${stats?.conversionRate ?? 0}%`, color: 'text-purple-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-5">
              <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">{s.label}</div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="debt">Highest Debt</option>
              <option value="quality">Highest Quality</option>
            </select>
          </div>
          <div className="flex gap-2 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {(['list', 'pipeline'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  view === v
                    ? 'bg-zinc-900 dark:bg-zinc-700 text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* List View */}
        {view === 'list' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden overflow-x-auto">
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
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">No leads match your filters.</td>
                  </tr>
                ) : (
                  filteredLeads.map((l) => (
                    <tr key={l.id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="p-4">
                        <div className="font-semibold text-black dark:text-white">{l.firstName} {l.lastName}</div>
                        <div className="text-xs text-zinc-400">{l.email} · {l.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[l.status] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="p-4 text-black dark:text-white">{l.state}</td>
                      <td className="p-4 text-right font-bold text-black dark:text-white">{formatCurrency(l.totalDebt)}</td>
                      <td className="p-4 text-right">
                        {typeof l.qualityScore === 'number' ? (
                          <span className={`font-bold ${l.qualityScore >= 70 ? 'text-green-600' : l.qualityScore >= 40 ? 'text-blue-600' : 'text-zinc-400'}`}>{l.qualityScore}</span>
                        ) : '—'}
                      </td>
                      <td className="p-4 text-right text-zinc-500">{formatDate(l.createdAt)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openLead(l)}
                          className="px-3 py-1.5 text-xs font-bold border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pipeline View */}
        {view === 'pipeline' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-2">
            {STATUS_OPTIONS.map((s) => (
              <div key={s} className="bg-zinc-100 dark:bg-zinc-950 rounded-2xl p-3 min-w-[220px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-black dark:text-white capitalize">{STATUS_LABELS[s]}</h3>
                  <span className="text-xs bg-white dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded-full">{pipelineCounts[s].length}</span>
                </div>
                <div className="space-y-3">
                  {pipelineCounts[s].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => openLead(l)}
                      className={`w-full text-left p-3 rounded-xl border-l-4 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all ${PIPELINE_COLORS[s]}`}
                    >
                      <div className="font-semibold text-sm text-black dark:text-white truncate">{l.firstName} {l.lastName}</div>
                      <div className="text-xs text-zinc-500 truncate">{l.state} · {formatCurrency(l.totalDebt)}</div>
                      {typeof l.qualityScore === 'number' && (
                        <div className="mt-2 text-xs font-bold text-zinc-500">Score {l.qualityScore}</div>
                      )}
                    </button>
                  ))}
                  {pipelineCounts[s].length === 0 && (
                    <div className="text-xs text-zinc-400 text-center py-4">No leads</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white">{selectedLead.firstName} {selectedLead.lastName}</h2>
                <div className="text-sm text-zinc-500">{selectedLead.email} · {selectedLead.phone} · {selectedLead.state}</div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[selectedLead.status] || ''}`}>{selectedLead.status}</span>
            </div>

            <div className="flex border-b border-zinc-100 dark:border-zinc-800">
              {(['overview', 'activity'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  className={`flex-1 py-3 text-sm font-medium capitalize ${
                    detailTab === t
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-6">
              {detailTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                      <div className="text-zinc-500 text-xs mb-1">Total Debt</div>
                      <div className="text-xl font-black text-black dark:text-white">{formatCurrency(selectedLead.totalDebt)}</div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                      <div className="text-zinc-500 text-xs mb-1">Quality Score</div>
                      <div className="text-xl font-black text-black dark:text-white">{selectedLead.qualityScore ?? '—'}</div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                      <div className="text-zinc-500 text-xs mb-1">Created</div>
                      <div className="font-semibold text-black dark:text-white">{formatDate(selectedLead.createdAt)}</div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                      <div className="text-zinc-500 text-xs mb-1">Debt Types</div>
                      <div className="font-semibold text-black dark:text-white">{selectedLead.debtTypes?.map((t) => DEBT_LABELS[t] || t).join(', ') || '—'}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Update Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-white"
                      placeholder="Add a note or call outcome..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setSelectedLead(null)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Cancel</button>
                    <button
                      onClick={handleSave}
                      disabled={saving || (status === selectedLead.status && !notes.trim())}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Update'}
                    </button>
                  </div>
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-4">
                  {parseActivities(selectedLead.salesNotes).length === 0 ? (
                    <p className="text-zinc-500 text-sm">No activity yet.</p>
                  ) : (
                    parseActivities(selectedLead.salesNotes).map((a, idx) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-4 py-1">
                        {a.date && <div className="text-xs text-zinc-400 mb-1">{a.date}</div>}
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{a.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
