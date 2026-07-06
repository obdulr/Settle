'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJsonApiClient } from '@settle/shared-sdk/auth';
import { getStoredToken, isAuthenticated, clearAuth } from '../../lib/authUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

interface Debt {
  id: string;
  creditor: string;
  balance: number;
  originalBalance?: number;
  interestRate?: number;
  dueDate?: string;
  type: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface DebtSummary {
  totalDebt: number;
  totalOriginal: number;
  totalSaved: number;
  debtCount: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export default function DebtsPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDebt, setNewDebt] = useState({
    creditor: '',
    balance: '',
    interestRate: '',
    dueDate: '',
    type: 'credit_card',
    notes: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchDebts = async () => {
      const token = getStoredToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const apiCall = createJsonApiClient({
          getBaseUrl: () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025',
          getToken: () => token,
          onUnauthorized: () => {
            clearAuth();
            router.push('/login');
          },
        });

        const [debtsData, summaryData] = await Promise.all([
          apiCall<Debt[]>('/debts', { method: 'GET' }),
          apiCall<DebtSummary>('/debts/summary', { method: 'GET' }),
        ]);

        setDebts(debtsData);
        setSummary(summaryData);
      } catch (err) {
        setError('Failed to load debts');
      } finally {
        setLoading(false);
      }
    };

    fetchDebts();
  }, [router]);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;

    try {
      const apiCall = createJsonApiClient({
        getBaseUrl: () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025',
        getToken: () => token,
        onUnauthorized: () => {
          clearAuth();
          router.push('/login');
        },
      });

      await apiCall<void>('/debts', {
        method: 'POST',
        body: JSON.stringify({
          ...newDebt,
          balance: parseFloat(newDebt.balance),
          interestRate: newDebt.interestRate ? parseFloat(newDebt.interestRate) : undefined,
        }),
      });

      // Refresh debts
      const [debtsData, summaryData] = await Promise.all([
        apiCall<Debt[]>('/debts', { method: 'GET' }),
        apiCall<DebtSummary>('/debts/summary', { method: 'GET' }),
      ]);

      setDebts(debtsData);
      setSummary(summaryData);
      setShowAddForm(false);
      setNewDebt({
        creditor: '',
        balance: '',
        interestRate: '',
        dueDate: '',
        type: 'credit_card',
        notes: '',
      });
    } catch (err) {
      setError('Failed to add debt');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">Debt Management</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Track and manage your debts to achieve financial peace
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Debt</h3>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${summary.totalDebt.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Original Balance</h3>
              <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                ${summary.totalOriginal.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Saved</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${summary.totalSaved.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Debts</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.debtCount}
              </p>
            </div>
          </div>
        )}

        {/* Add Debt Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : '+ Add Debt'}
          </button>
        </div>

        {/* Add Debt Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Add New Debt</h2>
            <form onSubmit={handleAddDebt} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Creditor
                </label>
                <input
                  type="text"
                  value={newDebt.creditor}
                  onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newDebt.balance}
                  onChange={(e) => setNewDebt({ ...newDebt, balance: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newDebt.interestRate}
                  onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDebt.dueDate}
                  onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Type
                </label>
                <select
                  value={newDebt.type}
                  onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="personal_loan">Personal Loan</option>
                  <option value="medical">Medical</option>
                  <option value="student_loan">Student Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Notes
                </label>
                <textarea
                  value={newDebt.notes}
                  onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Debt
              </button>
            </form>
          </div>
        )}

        {/* Debts List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Your Debts</h2>
            {debts.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">No debts added yet.</p>
            ) : (
              <div className="space-y-4">
                {debts.map((debt) => (
                  <div key={debt.id} className="border-b border-zinc-200 dark:border-zinc-700 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-black dark:text-white">{debt.creditor}</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">{debt.type.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          ${debt.balance.toLocaleString()}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">{debt.status}</p>
                      </div>
                    </div>
                    {debt.interestRate && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        Interest Rate: {debt.interestRate}%
                      </p>
                    )}
                    {debt.dueDate && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Due Date: {new Date(debt.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {debt.notes && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{debt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}