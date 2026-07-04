'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJsonApiClient } from '@settle/shared-sdk/auth';
import { getStoredToken, getStoredUser, clearAuth, isAuthenticated } from '../../lib/authUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [updateMessage, setUpdateMessage] = useState('');

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
        setEditForm({
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          email: response.email || '',
          phone: response.phone || '',
        });
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

  const handleUpdateProfile = async () => {
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

      const response = await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });

      setUser(response);
      setIsEditing(false);
      setUpdateMessage('Profile updated successfully');
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white">Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              Edit
            </button>
          )}
        </div>
        
        {updateMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded text-green-800 dark:text-green-200">
            {updateMessage}
          </div>
        )}

        {user && (
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 px-4 bg-zinc-300 text-zinc-700 rounded-md hover:bg-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-700 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
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

                {user.phone && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Phone
                    </label>
                    <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-black dark:text-white">
                      {user.phone}
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
              </>
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