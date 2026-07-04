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

export default function ProfilePage() {
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
          getBaseUrl: () => process.env.NEXT_PUBLIC_API_URL || 'https://api.settleinpeace.com',
          getToken: () => token,
          onUnauthorized: () => {
            clearAuth();
            router.push('/login');
          },
        });

        const response = await apiCall('/auth/profile', {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">Profile</h1>
        
        {user && (
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Email
              </label>
              <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-black dark:text-white">
                {user.email}
              </div>
            </div>

            {user.firstName && (
              <div>
                <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  First Name
                </label>
                <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-black dark:text-white">
                  {user.firstName}
                </div>
              </div>
            )}

            {user.lastName && (
              <div>
                <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Last Name
                </label>
                <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-black dark:text-white">
                  {user.lastName}
                </div>
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                User ID
              </label>
              <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-black dark:text-white font-mono text-sm">
                {user.id}
              </div>
            </div>

            {user.role && (
              <div>
                <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Role
                </label>
                <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-black dark:text-white">
                  {user.role}
                </div>
              </div>
            )}

            {user.createdAt && (
              <div>
                <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Member Since
                </label>
                <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-black dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}