'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createJsonApiClient } from '@settle/shared-sdk/auth';
import { storeAuth, isAuthenticated, clearAuth } from '../../../lib/authUtils';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025';

export default function SalesLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated()) {
      router.replace('/sales');
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return <LoadingSpinner />;
  }

  const apiCall = createJsonApiClient({
    getBaseUrl: () => API_URL,
    getToken: () => null,
    onUnauthorized: () => {
      clearAuth();
      router.push('/sales/login');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiCall<{
        success: boolean;
        accessToken?: string;
        refreshToken?: string;
        user?: any;
        error?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.accessToken) {
        const role = response.user?.role;
        if (role !== 'sales' && role !== 'admin') {
          setError('This portal is for sales and admin users only.');
          setLoading(false);
          return;
        }
        storeAuth(response.accessToken, response.user, response.refreshToken);
        router.push('/sales');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 px-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-xl font-bold text-blue-600 mb-2">
            Settle<span className="text-blue-400">InPeace</span>
          </Link>
          <h1 className="text-2xl font-bold text-black dark:text-white">Sales Team Login</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">For sales agents and admin staff</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="sales@settleinpeace.com"
              className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
          >
            {loading ? 'Logging in...' : 'Login to Sales CRM'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Not a sales user?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Customer / Provider Login</Link>
          </p>
          <p>
            <Link href="/" className="text-zinc-500 hover:text-zinc-300">← Back to website</Link>
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">📞</div>
            <div className="text-xs text-zinc-500 mt-1">Built-in Dialer</div>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">✉️</div>
            <div className="text-xs text-zinc-500 mt-1">Email Leads</div>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">📅</div>
            <div className="text-xs text-zinc-500 mt-1">Calendar</div>
          </div>
        </div>
      </div>
    </div>
  );
}
