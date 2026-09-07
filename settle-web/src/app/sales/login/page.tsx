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
      router.replace('/collections');
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
        router.push('/collections');
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-xl font-bold text-blue-600 mb-2">
            Settle<span className="text-blue-400">InPeace</span>
          </Link>
          <h1 className="text-2xl font-bold text-black dark:text-white">Sales CRM Login</h1>
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

        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Not a sales user?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Customer / Provider Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
