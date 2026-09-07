'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthenticatedApi } from '@/lib/api';
import { getStoredUser, isAuthenticated } from '@/lib/authUtils';

const STATUS_OPTIONS = [
  'new',
  'active',
  'contacted',
  'payment_plan',
  'settled',
  'paid_in_full',
  'litigation',
  'charge_off',
  'bankruptcy',
  'deceased',
  'closed',
];

const PRIORITY_LABELS: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };

interface CollectionAccount {
  id: string;
  crmClientId: string;
  creditorId?: string;
  accountNumber?: string;
  originalBalance: number;
  currentBalance: number;
  status: string;
  priority: number;
  delinquencyDays: number;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalAccounts: number;
  totalBalance: number;
  statusCounts: { status: string; count: number }[];
}

export default function CollectionsDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<CollectionAccount[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<CollectionAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'skipTrace' | 'calls' | 'creditReports' | 'backgroundChecks'>('overview');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Forms
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      router.push('/login');
      return;
    }
    const parsed = getStoredUser();
    if (!parsed || (parsed.role !== 'admin' && parsed.role !== 'sales')) {
      router.push('/dashboard');
      return;
    }
    setUser(parsed);
    loadData();
  }, [router, refreshKey]);

  const loadData = async () => {
    if (typeof window === 'undefined' || !isAuthenticated()) return;
    setLoading(true);
    setError('');
    try {
      const api = getAuthenticatedApi();
      const [accountsRes, statsRes] = await Promise.all([
        api<{ accounts: CollectionAccount[] }>(`/collections/accounts?status=${statusFilter || ''}&search=${encodeURIComponent(search)}&limit=100`, { method: 'GET' }),
        api<DashboardStats>('/collections/dashboard', { method: 'GET' }),
      ]);
      setAccounts(accountsRes.accounts || []);
      setStats(statsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load collections data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    try {
      await getAuthenticatedApi()('/collections/accounts', {
        method: 'POST',
        body: JSON.stringify({
          crmClientId: formData.get('crmClientId') as string,
          accountNumber: formData.get('accountNumber') as string,
          originalBalance: parseFloat(formData.get('originalBalance') as string) || 0,
          currentBalance: parseFloat(formData.get('currentBalance') as string) || 0,
          status: formData.get('status') as string,
          priority: parseInt(formData.get('priority') as string, 10) || 2,
          delinquencyDays: parseInt(formData.get('delinquencyDays') as string, 10) || 0,
          notes: formData.get('notes') as string,
        }),
      });
      setNewAccountOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await getAuthenticatedApi()(`/collections/accounts/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!selectedAccount || !newNote.trim()) return;
    setSaving(true);
    try {
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}/notes`, { method: 'POST', body: JSON.stringify({ content: newNote }) });
      setNewNote('');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const handleRunSkipTrace = async () => {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}/skip-trace`, {
        method: 'POST',
        body: JSON.stringify({ searchCriteria: { firstName: '', lastName: '', phone: phone || '' } }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to run skip trace');
    } finally {
      setSaving(false);
    }
  };

  const handleDialCall = async () => {
    if (!selectedAccount || !phone) return;
    setSaving(true);
    try {
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}/calls/dial`, { method: 'POST', body: JSON.stringify({ to: phone }) });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to dial call');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  if (loading && !accounts.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Debt Collection CRM</h1>
          <button
            onClick={() => setNewAccountOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            + New Account
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Accounts</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalAccounts}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Balance</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(stats.totalBalance)}</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 col-span-2">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Status Breakdown</div>
              <div className="flex flex-wrap gap-2">
                {stats.statusCounts.map((s) => (
                  <span key={s.status} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-700 dark:text-zinc-300">
                    {s.status}: {s.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search account number or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium"
          >
            Filter
          </button>
        </div>

        {/* Accounts table */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Account</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Delinquency</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">{account.accountNumber || '—'}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 capitalize">{account.status}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{PRIORITY_LABELS[account.priority] || account.priority}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{formatCurrency(account.currentBalance)}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{account.delinquencyDays} days</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelectedAccount(account); setActiveTab('overview'); }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!accounts.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No collection accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Account Modal */}
      {newAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-lg w-full p-6">
            <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">New Collection Account</h2>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <input name="crmClientId" required placeholder="CRM Client ID" className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
              <input name="accountNumber" placeholder="Account Number" className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input name="originalBalance" type="number" step="0.01" placeholder="Original Balance" className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
                <input name="currentBalance" type="number" step="0.01" placeholder="Current Balance" className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select name="status" defaultValue="new" className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select name="priority" defaultValue="2" className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm">
                  <option value="1">Low</option>
                  <option value="2">Medium</option>
                  <option value="3">High</option>
                  <option value="4">Critical</option>
                </select>
              </div>
              <input name="delinquencyDays" type="number" placeholder="Delinquency Days" className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
              <textarea name="notes" placeholder="Notes" className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setNewAccountOpen(false)} className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:underline text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Creating...' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Detail Panel */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-zinc-900 shadow-xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Account {selectedAccount.accountNumber || selectedAccount.id}</h2>
              <button onClick={() => setSelectedAccount(null)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-2xl">&times;</button>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto">
              {(['overview', 'notes', 'skipTrace', 'calls', 'creditReports', 'backgroundChecks'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${activeTab === tab ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                >
                  {tab.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Current Balance</div>
                    <div className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(selectedAccount.currentBalance)}</div>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Original Balance</div>
                    <div className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(selectedAccount.originalBalance)}</div>
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Change Status</div>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(selectedAccount.id, s)}
                        className={`px-2 py-1 rounded text-xs border ${selectedAccount.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Notes</div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{selectedAccount.notes || 'No notes.'}</p>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            )}

            {(activeTab === 'skipTrace' || activeTab === 'calls') && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={activeTab === 'calls' ? 'Phone number to dial (E.164)' : 'Phone / identifier for skip trace'}
                  className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                />
                <button
                  onClick={activeTab === 'calls' ? handleDialCall : handleRunSkipTrace}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Working...' : activeTab === 'calls' ? 'Dial Call' : 'Run Skip Trace'}
                </button>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {activeTab === 'calls'
                    ? 'Calls are placed through the Telnyx integration when configured; otherwise a mock call log is created.'
                    : 'Skip trace records a manual search request. Add a background-check or credit-report provider to fetch structured data.'}
                </p>
              </div>
            )}

            {(activeTab === 'creditReports' || activeTab === 'backgroundChecks') && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p>Use the backend endpoints directly to upload {activeTab === 'creditReports' ? 'credit report' : 'background check'} JSON:</p>
                <code className="block mt-2 p-2 bg-zinc-100 dark:bg-zinc-950 rounded text-xs">
                  POST /collections/accounts/{selectedAccount.id}/{activeTab === 'creditReports' ? 'credit-reports' : 'background-checks'}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
