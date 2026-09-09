'use client';

import { useEffect, useMemo, useState } from 'react';
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
  customFields?: Record<string, any>;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'paymentPlan' | 'outreach' | 'history' | 'skipTrace' | 'calls' | 'creditReports' | 'backgroundChecks'>('overview');

  // Sales team data for admin assignment
  const [salesAgents, setSalesAgents] = useState<{ id: string; email: string; firstName?: string; lastName?: string }[]>([]);
  const [assignedToFilter, setAssignedToFilter] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [viewMode, setViewMode] = useState<'accounts' | 'queue'>('accounts');

  const SEGMENTS = [
    { value: '', label: 'All Accounts' },
    { value: 'critical', label: 'Critical Priority' },
    { value: 'high_balance', label: 'High Balance (≥$5,000)' },
    { value: 'late', label: '90+ Days Late' },
    { value: 'paused', label: 'Paused / Vulnerability' },
    { value: 'has_outreach', label: 'Has Outreach Scheduled' },
    { value: 'has_plan', label: 'Has Payment Plan' },
  ];

  const displayedAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (!segmentFilter) return true;
      switch (segmentFilter) {
        case 'critical': return a.priority === 4;
        case 'high_balance': return a.currentBalance >= 5000;
        case 'late': return a.delinquencyDays >= 90;
        case 'paused': return a.customFields?.vulnerability?.paused;
        case 'has_outreach': return a.customFields?.outreach;
        case 'has_plan': return a.customFields?.paymentPlan;
        default: return true;
      }
    });
  }, [accounts, segmentFilter]);

  // Forms
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Vulnerability pause
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseNotes, setPauseNotes] = useState('');

  // Payment plan
  const [planMonths, setPlanMonths] = useState(6);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planMonthlyPayment, setPlanMonthlyPayment] = useState('');
  const [planPaymentMethod, setPlanPaymentMethod] = useState('bank_debit');

  // Outreach queue
  const [outreachDate, setOutreachDate] = useState('');
  const [outreachTime, setOutreachTime] = useState('09:00');
  const [outreachTimeZone, setOutreachTimeZone] = useState('America/New_York');
  const [outreachChannel, setOutreachChannel] = useState('sms');
  const [outreachMessage, setOutreachMessage] = useState('');
  const [outreachQuietHours, setOutreachQuietHours] = useState(true);
  const [outreachFrequencyCap, setOutreachFrequencyCap] = useState(3);

  // Audit history
  const [historyItems, setHistoryItems] = useState<{ id: string; type: 'note' | 'call' | 'change'; content: string; createdAt: string; authorId?: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const US_TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
  ];

  const VULNERABILITY_REASONS = [
    'Job loss / Hardship',
    'Dispute',
    'Illness / Medical',
    'Bankruptcy',
    'Deceased',
    'Natural disaster',
    'Other',
  ];

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
    if (parsed.role === 'admin') loadSalesAgents();
  }, [router, refreshKey]);

  useEffect(() => {
    if (activeTab === 'history' && selectedAccount) {
      loadHistory();
    }
  }, [activeTab, selectedAccount]);

  const loadData = async () => {
    if (typeof window === 'undefined' || !isAuthenticated()) return;
    setLoading(true);
    setError('');
    try {
      const api = getAuthenticatedApi();
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (assignedToFilter) params.set('assignedTo', assignedToFilter);
      params.set('limit', '100');
      const [accountsRes, statsRes] = await Promise.all([
        api<{ accounts: CollectionAccount[] }>(`/collections/accounts?${params.toString()}`, { method: 'GET' }),
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

  const loadSalesAgents = async () => {
    if (typeof window === 'undefined' || !isAuthenticated()) return;
    try {
      const api = getAuthenticatedApi();
      const agents = await api<{ id: string; email: string; firstName?: string; lastName?: string }[]>('/admin/users?role=sales', { method: 'GET' });
      setSalesAgents(agents || []);
    } catch (err: any) {
      console.error('Failed to load sales agents', err?.message);
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

  const handleAssignAccount = async (id: string, assignedTo: string) => {
    try {
      await getAuthenticatedApi()(`/collections/accounts/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedTo }) });
      if (selectedAccount && selectedAccount.id === id) {
        setSelectedAccount({ ...selectedAccount, assignedTo: assignedTo || undefined });
      }
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign account');
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

  const handlePauseAccount = async () => {
    if (!selectedAccount || !pauseReason) return;
    setSaving(true);
    try {
      const updatedCustomFields = {
        ...(selectedAccount.customFields || {}),
        vulnerability: {
          paused: true,
          reason: pauseReason,
          notes: pauseNotes,
          pausedAt: new Date().toISOString(),
          pausedBy: user?.id,
        },
      };
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}`, {
        method: 'PUT',
        body: JSON.stringify({ customFields: updatedCustomFields }),
      });
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          content: `Collection paused: ${pauseReason}${pauseNotes ? ` — ${pauseNotes}` : ''}`,
        }),
      });
      setPauseModalOpen(false);
      setPauseReason('');
      setPauseNotes('');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to pause account');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeAccount = async () => {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      const updatedCustomFields = { ...(selectedAccount.customFields || {}) };
      delete updatedCustomFields.vulnerability;
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}`, {
        method: 'PUT',
        body: JSON.stringify({ customFields: updatedCustomFields }),
      });
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Collection resumed / vulnerability flag cleared.' }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to resume account');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentPlan = async () => {
    if (!selectedAccount) return;
    const monthly = parseFloat(planMonthlyPayment) || 0;
    const months = planMonths || 6;
    if (monthly <= 0) {
      setError('Monthly payment must be greater than 0');
      return;
    }
    setSaving(true);
    try {
      const totalRepayment = monthly * months;
      const plan = {
        monthlyPayment: monthly,
        termMonths: months,
        startDate: planStartDate || new Date().toISOString().split('T')[0],
        paymentMethod: planPaymentMethod,
        totalRepayment,
        originalBalance: selectedAccount.currentBalance,
        createdAt: new Date().toISOString(),
        createdBy: user?.id,
      };
      const updatedCustomFields = { ...(selectedAccount.customFields || {}), paymentPlan: plan };
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}`, {
        method: 'PUT',
        body: JSON.stringify({ customFields: updatedCustomFields, monthlyPayment: monthly, status: 'payment_plan' }),
      });
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          content: `Payment arrangement set: ${months} months × ${formatCurrency(monthly)}/month (${planPaymentMethod}). Total: ${formatCurrency(totalRepayment)}.`,
        }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to save payment plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOutreach = async () => {
    if (!selectedAccount) return;
    if (!outreachDate) {
      setError('Please select a contact date');
      return;
    }
    setSaving(true);
    try {
      const scheduledAt = `${outreachDate}T${outreachTime || '09:00'}`;
      const outreach = {
        scheduledAt,
        timeZone: outreachTimeZone,
        channel: outreachChannel,
        message: outreachMessage,
        respectQuietHours: outreachQuietHours,
        weeklyFrequencyCap: outreachFrequencyCap,
        createdAt: new Date().toISOString(),
        createdBy: user?.id,
        status: 'scheduled',
      };
      const updatedCustomFields = { ...(selectedAccount.customFields || {}), outreach };
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}`, {
        method: 'PUT',
        body: JSON.stringify({ customFields: updatedCustomFields }),
      });
      await getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          content: `Outreach scheduled: ${outreachChannel} on ${scheduledAt} (${outreachTimeZone}). Quiet hours: ${outreachQuietHours ? 'yes' : 'no'}.`,
        }),
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule outreach');
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedAccount) return;
    setHistoryLoading(true);
    try {
      const [notes, calls] = await Promise.all([
        getAuthenticatedApi()<{ id: string; content: string; createdAt: string; authorId?: string; noteType?: string }[]>(`/collections/accounts/${selectedAccount.id}/notes`, { method: 'GET' }),
        getAuthenticatedApi()<{ id: string; status: string; phoneNumber: string; createdAt: string; duration?: number; notes?: string }[]>(`/collections/accounts/${selectedAccount.id}/calls`, { method: 'GET' }),
      ]);
      const items = [
        ...(notes || []).map((n) => ({
          id: `note-${n.id}`,
          type: 'note' as const,
          content: `[${n.noteType || 'general'}] ${n.content}`,
          createdAt: n.createdAt,
          authorId: n.authorId,
        })),
        ...(calls || []).map((c) => ({
          id: `call-${c.id}`,
          type: 'call' as const,
          content: `Call to ${c.phoneNumber} — ${c.status}${c.duration ? ` (${c.duration}s)` : ''}${c.notes ? ` — ${c.notes}` : ''}`,
          createdAt: c.createdAt,
        })),
        {
          id: `created-${selectedAccount.id}`,
          type: 'change' as const,
          content: `Account created with status ${selectedAccount.status} and balance ${formatCurrency(selectedAccount.currentBalance)}`,
          createdAt: selectedAccount.createdAt,
        },
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistoryItems(items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
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

  const queueItems = useMemo(() => {
    return accounts
      .filter((a) => a.customFields?.outreach)
      .map((a) => ({
        account: a,
        outreach: a.customFields!.outreach,
        scheduledAt: new Date(a.customFields!.outreach.scheduledAt).getTime(),
      }))
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }, [accounts]);

  const segmentCounts = useMemo(() => {
    return {
      critical: accounts.filter((a) => a.priority === 4).length,
      high_balance: accounts.filter((a) => a.currentBalance >= 5000).length,
      late: accounts.filter((a) => a.delinquencyDays >= 90).length,
      paused: accounts.filter((a) => a.customFields?.vulnerability?.paused).length,
      has_outreach: accounts.filter((a) => a.customFields?.outreach).length,
      has_plan: accounts.filter((a) => a.customFields?.paymentPlan).length,
    };
  }, [accounts]);

  const getAssignedToName = (id?: string) => {
    if (!id) return 'Unassigned';
    const agent = salesAgents.find((a) => a.id === id);
    return agent ? `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email : `User ${id.slice(0, 8)}...`;
  };

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

        {/* View mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('accounts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'accounts'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
            }`}
          >
            Accounts
          </button>
          <button
            onClick={() => setViewMode('queue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'queue'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
            }`}
          >
            Outreach Queue ({queueItems.length})
          </button>
        </div>

        {viewMode === 'queue' ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Account</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Scheduled</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Channel</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Time Zone</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Message</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {queueItems.map(({ account, outreach }) => (
                  <tr key={account.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950">
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">{account.accountNumber || '—'}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {new Date(outreach.scheduledAt).toLocaleString(undefined, { timeZone: outreach.timeZone })}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 capitalize">{outreach.channel}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 text-xs">{outreach.timeZone}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 text-xs max-w-xs truncate">{outreach.message || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelectedAccount(account); setActiveTab('outreach'); }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!queueItems.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                      No scheduled outreach.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <>
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
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          >
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}{s.value ? ` (${segmentCounts[s.value as keyof typeof segmentCounts]})` : ''}
              </option>
            ))}
          </select>
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
          {user?.role === 'admin' && (
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            >
              <option value="">All Reps</option>
              <option value="unassigned">Unassigned</option>
              {salesAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {`${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email}
                </option>
              ))}
            </select>
          )}
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
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {displayedAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">
                    {account.accountNumber || '—'}
                    {account.customFields?.vulnerability?.paused && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 capitalize">{account.status}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{PRIORITY_LABELS[account.priority] || account.priority}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{formatCurrency(account.currentBalance)}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{account.delinquencyDays} days</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 text-xs">{getAssignedToName(account.assignedTo)}</td>
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
              {!displayedAccounts.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No accounts in this segment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
        )}

      {/* Pause Modal */}
      {pauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-lg w-full p-6">
            <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">Pause Collection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Reason *</label>
                <select
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                >
                  <option value="">Select a reason</option>
                  {VULNERABILITY_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Additional notes</label>
                <textarea
                  value={pauseNotes}
                  onChange={(e) => setPauseNotes(e.target.value)}
                  placeholder="e.g. Debtor mentioned job loss, cannot manage payments."
                  className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPauseModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:underline text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePauseAccount}
                  disabled={saving || !pauseReason}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Pausing...' : 'Pause Collection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {(['overview', 'notes', 'paymentPlan', 'outreach', 'history', 'skipTrace', 'calls', 'creditReports', 'backgroundChecks'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${activeTab === tab ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                >
                  {tab === 'paymentPlan' ? 'Payment Plan' : tab === 'outreach' ? 'Outreach' : tab === 'history' ? 'History' : tab.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}
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
                {selectedAccount.customFields?.vulnerability?.paused ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-red-800 dark:text-red-200">Collection Paused</span>
                      <button
                        onClick={handleResumeAccount}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Resume
                      </button>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Reason: {selectedAccount.customFields.vulnerability.reason}
                    </p>
                    {selectedAccount.customFields.vulnerability.notes && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {selectedAccount.customFields.vulnerability.notes}
                      </p>
                    )}
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Paused {new Date(selectedAccount.customFields.vulnerability.pausedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Vulnerability / Pause</div>
                    <button
                      onClick={() => setPauseModalOpen(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                    >
                      Pause Collection
                    </button>
                  </div>
                )}

                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Compliance & Consent</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded">TCPA Consent</span>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded">SOC 2</span>
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded">GDPR Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tcpaConsent"
                      checked={selectedAccount.customFields?.consent?.tcpa || false}
                      onChange={(e) => {
                        const updatedCustomFields = {
                          ...(selectedAccount.customFields || {}),
                          consent: {
                            ...(selectedAccount.customFields?.consent || {}),
                            tcpa: e.target.checked,
                            capturedAt: new Date().toISOString(),
                          },
                        };
                        getAuthenticatedApi()(`/collections/accounts/${selectedAccount.id}`, {
                          method: 'PUT',
                          body: JSON.stringify({ customFields: updatedCustomFields }),
                        });
                      }}
                      className="rounded border-zinc-300"
                    />
                    <label htmlFor="tcpaConsent" className="text-sm text-zinc-700 dark:text-zinc-300">
                      TCPA/DNC consent captured
                    </label>
                  </div>
                  {selectedAccount.customFields?.consent?.capturedAt && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Captured {new Date(selectedAccount.customFields.consent.capturedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {user?.role === 'admin' && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Assign To</div>
                    <select
                      value={selectedAccount.assignedTo || ''}
                      onChange={(e) => handleAssignAccount(selectedAccount.id, e.target.value)}
                      className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {salesAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {`${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'outreach' && (
              <div className="space-y-5">
                {selectedAccount.customFields?.outreach ? (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 rounded-lg">
                    <div className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Scheduled Outreach</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">Date/Time</div>
                        <div className="font-semibold text-indigo-900 dark:text-indigo-100">
                          {new Date(selectedAccount.customFields.outreach.scheduledAt).toLocaleString(undefined, { timeZone: selectedAccount.customFields.outreach.timeZone })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">Channel</div>
                        <div className="font-semibold text-indigo-900 dark:text-indigo-100 capitalize">
                          {selectedAccount.customFields.outreach.channel}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">Time Zone</div>
                        <div className="font-semibold text-indigo-900 dark:text-indigo-100">
                          {selectedAccount.customFields.outreach.timeZone}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">Quiet Hours</div>
                        <div className="font-semibold text-indigo-900 dark:text-indigo-100">
                          {selectedAccount.customFields.outreach.respectQuietHours ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                    {selectedAccount.customFields.outreach.message && (
                      <div className="mt-3 p-2 bg-white dark:bg-zinc-800 rounded text-sm text-zinc-700 dark:text-zinc-300">
                        {selectedAccount.customFields.outreach.message}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Contact Date *</label>
                        <input
                          type="date"
                          value={outreachDate}
                          onChange={(e) => setOutreachDate(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Time</label>
                        <input
                          type="time"
                          value={outreachTime}
                          onChange={(e) => setOutreachTime(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Time Zone</label>
                        <select
                          value={outreachTimeZone}
                          onChange={(e) => setOutreachTimeZone(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        >
                          {US_TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Channel</label>
                        <select
                          value={outreachChannel}
                          onChange={(e) => setOutreachChannel(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        >
                          <option value="sms">SMS</option>
                          <option value="call">Call</option>
                          <option value="email">Email</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Message (optional)</label>
                      <textarea
                        value={outreachMessage}
                        onChange={(e) => setOutreachMessage(e.target.value)}
                        placeholder="e.g. Hi, this is about your overdue balance. Can we set up a payment plan?"
                        className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="quietHours"
                          checked={outreachQuietHours}
                          onChange={(e) => setOutreachQuietHours(e.target.checked)}
                          className="rounded border-zinc-300"
                        />
                        <label htmlFor="quietHours" className="text-sm text-zinc-700 dark:text-zinc-300">Respect 8pm-8am quiet hours</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Weekly contact cap</label>
                        <input
                          type="number"
                          min={1}
                          max={7}
                          value={outreachFrequencyCap}
                          onChange={(e) => setOutreachFrequencyCap(parseInt(e.target.value, 10) || 3)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveOutreach}
                      disabled={saving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? 'Scheduling...' : 'Schedule Outreach'}
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Decision & Contact Audit Trail</div>
                {historyLoading ? (
                  <div className="text-sm text-zinc-500">Loading history...</div>
                ) : (
                  <div className="space-y-3">
                    {historyItems.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border-l-4 border-zinc-300 dark:border-zinc-700">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                          item.type === 'note' ? 'bg-blue-500' : item.type === 'call' ? 'bg-green-500' : 'bg-zinc-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-zinc-800 dark:text-zinc-200">{item.content}</p>
                          <p className="text-xs text-zinc-500 mt-1">{new Date(item.createdAt).toLocaleString()} {item.authorId ? `· by ${item.authorId.slice(0, 8)}` : ''}</p>
                        </div>
                      </div>
                    ))}
                    {!historyItems.length && (
                      <div className="text-sm text-zinc-500">No history yet.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'paymentPlan' && (
              <div className="space-y-5">
                {selectedAccount.customFields?.paymentPlan ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 rounded-lg">
                    <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Active Payment Arrangement</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Monthly Payment</div>
                        <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                          {formatCurrency(selectedAccount.customFields.paymentPlan.monthlyPayment)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Term</div>
                        <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                          {selectedAccount.customFields.paymentPlan.termMonths} months
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Total Repayment</div>
                        <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                          {formatCurrency(selectedAccount.customFields.paymentPlan.totalRepayment)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Start Date</div>
                        <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                          {selectedAccount.customFields.paymentPlan.startDate}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">AI-suggested plans</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[3, 6, 12].map((months) => {
                          const monthly = selectedAccount.currentBalance / months;
                          return (
                            <button
                              key={months}
                              onClick={() => { setPlanMonths(months); setPlanMonthlyPayment(monthly.toFixed(2)); }}
                              className={`p-3 text-left rounded-lg border ${
                                planMonths === months
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                              }`}
                            >
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">{months} months</div>
                              <div className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(monthly)}/mo</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Interest-free</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Monthly Payment</label>
                        <input
                          type="number"
                          step="0.01"
                          value={planMonthlyPayment}
                          onChange={(e) => setPlanMonthlyPayment(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Term (months)</label>
                        <input
                          type="number"
                          value={planMonths}
                          onChange={(e) => setPlanMonths(parseInt(e.target.value, 10) || 6)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={planStartDate}
                          onChange={(e) => setPlanStartDate(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Payment Method</label>
                        <select
                          value={planPaymentMethod}
                          onChange={(e) => setPlanPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                        >
                          <option value="bank_debit">Bank Debit</option>
                          <option value="card">Card</option>
                          <option value="manual">Manual Payment</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleSavePaymentPlan}
                      disabled={saving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Lock Payment Arrangement'}
                    </button>
                  </>
                )}
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
  </div>
  );
}
