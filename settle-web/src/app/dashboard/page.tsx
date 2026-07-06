'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJsonApiClient } from '@settle/shared-sdk/auth';
import { getStoredToken, getStoredUser, clearAuth, isAuthenticated } from '../../lib/authUtils';

interface UserProfile {
  id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
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

        const response = await apiCall<UserProfile>('/auth/profile', {
          method: 'GET',
        });

        setUser(response);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Welcome back, {user?.firstName || user?.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Here's an overview of your account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Account Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Email</p>
                <p className="text-black dark:text-white">{user?.email}</p>
              </div>
              {user?.firstName && (
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Name</p>
                  <p className="text-black dark:text-white">{user.firstName} {user.lastName}</p>
                </div>
              )}
              {user?.phone && (
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Phone</p>
                  <p className="text-black dark:text-white">{user.phone}</p>
                </div>
              )}
              {user?.role && (
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Role</p>
                  <p className="text-black dark:text-white capitalize">{user.role}</p>
                </div>
              )}
              {user?.createdAt && (
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Member Since</p>
                  <p className="text-black dark:text-white">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/debts"
                className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
              >
                Manage Debts
              </a>
              <a
                href="/profile"
                className="block w-full py-2 px-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 text-center"
              >
                Edit Profile
              </a>
              <a
                href="/settings"
                className="block w-full py-2 px-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 text-center"
              >
                Settings
              </a>
              <button
                onClick={handleLogout}
                className="block w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Financial Peace Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Your Journey to Peace</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Debt Tracking</span>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Start Now</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Financial Education</span>
                <span className="text-gray-400 dark:text-gray-500 font-medium">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Debt Settlement</span>
                <span className="text-gray-400 dark:text-gray-500 font-medium">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Financial Coaching</span>
                <span className="text-gray-400 dark:text-gray-500 font-medium">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Recent Activity</h2>
          <div className="text-zinc-600 dark:text-zinc-400">
            <p>No recent activity to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
}