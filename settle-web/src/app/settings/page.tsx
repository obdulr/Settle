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

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">Settings</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <nav className="flex space-x-8">
            {['profile', 'security', 'notifications', 'danger'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded text-green-800 dark:text-green-200">
            {successMessage}
          </div>
        )}

        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  First Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.firstName || ''}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Last Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.lastName || ''}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Phone
                </label>
                <input
                  type="tel"
                  defaultValue={user?.phone || ''}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <button
                onClick={() => setSuccessMessage('Profile updated successfully')}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                <div>
                  <p className="font-medium text-black dark:text-white">Change Password</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Update your password to keep your account secure
                  </p>
                </div>
                <a
                  href="/forgot-password"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Change
                </a>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                <div>
                  <p className="font-medium text-black dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-md text-sm"
                >
                  Coming Soon
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                <div>
                  <p className="font-medium text-black dark:text-white">Active Sessions</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Manage your active login sessions
                  </p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-md text-sm"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                <div>
                  <p className="font-medium text-black dark:text-white">Email Notifications</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Receive email updates about your account
                  </p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-md text-sm"
                >
                  Configure
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                <div>
                  <p className="font-medium text-black dark:text-white">SMS Notifications</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Receive SMS updates on your phone
                  </p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-md text-sm"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        {activeTab === 'danger' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border-2 border-red-200 dark:border-red-900">
            <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                <div>
                  <p className="font-medium text-black dark:text-white">Delete Account</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Permanently delete your account and all data
                  </p>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Delete Account
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                <div>
                  <p className="font-medium text-black dark:text-white">Logout All Devices</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Sign out from all devices and sessions
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Logout All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}