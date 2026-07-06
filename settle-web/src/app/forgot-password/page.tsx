'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJsonApiClient } from '@settle/shared-sdk/auth';
import { isValidEmail } from '../../lib/authUtils';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      setLoading(false);
      return;
    }

    try {
      const apiCall = createJsonApiClient({
        getBaseUrl: () => process.env.NEXT_PUBLIC_API_URL || 'https://api.settleinpeace.com',
        getToken: () => null,
      });

      const response = await apiCall<{ success: boolean; message?: string; error?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      setMessage(response.message || 'Password reset link sent if email exists');
    } catch (err) {
      setError('Failed to send password reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">Forgot Password</h1>
        
        {message && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded text-green-800 dark:text-green-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Remember your password?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}