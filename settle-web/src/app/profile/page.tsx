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
  phoneVerified?: boolean;
  emailVerified?: boolean;
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
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneVerifyInfo, setPhoneVerifyInfo] = useState('');
  const [phoneVerifyError, setPhoneVerifyError] = useState('');
  const [phoneVerifying, setPhoneVerifying] = useState(false);

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
        setEditForm({
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          email: response.email || '',
          phone: response.phone || '',
        });
        setPhoneOtpSent(false);
        setPhoneOtpCode('');
        setPhoneVerifyInfo('');
        setPhoneVerifyError('');
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

      const response = await apiCall<UserProfile>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });

      setUser(response);
      setIsEditing(false);
      setUpdateMessage('Profile updated successfully');
      setPhoneOtpSent(false);
      setPhoneOtpCode('');
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleSendPhoneOtp = async () => {
    const token = getStoredToken();
    if (!token) return;
    setPhoneVerifying(true);
    setPhoneVerifyError('');
    setPhoneVerifyInfo('');
    try {
      const apiCall = createJsonApiClient({
        getBaseUrl: () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025',
        getToken: () => token,
        onUnauthorized: () => { clearAuth(); router.push('/login'); },
      });
      const res = await apiCall<{ success: boolean; message: string; devCode?: string }>('/auth/send-phone-otp', { method: 'POST' });
      if (res.success) {
        setPhoneOtpSent(true);
        setPhoneVerifyInfo(res.devCode
          ? `Dev mode — your code is: ${res.devCode}`
          : res.message || 'Verification code sent to your phone.'
        );
      } else {
        setPhoneVerifyError(res.message || 'Failed to send code');
      }
    } catch {
      setPhoneVerifyError('Failed to send verification code');
    } finally {
      setPhoneVerifying(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const token = getStoredToken();
    if (!token) return;
    setPhoneVerifying(true);
    setPhoneVerifyError('');
    try {
      const apiCall = createJsonApiClient({
        getBaseUrl: () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025',
        getToken: () => token,
        onUnauthorized: () => { clearAuth(); router.push('/login'); },
      });
      const res = await apiCall<{ success: boolean; message: string }>('/auth/verify-phone-otp', {
        method: 'POST',
        body: JSON.stringify({ code: phoneOtpCode }),
      });
      if (res.success) {
        setUser(prev => prev ? { ...prev, phoneVerified: true } : prev);
        setPhoneOtpSent(false);
        setPhoneOtpCode('');
        setPhoneVerifyInfo(res.message || 'Phone number verified!');
      } else {
        setPhoneVerifyError(res.message || 'Invalid code');
      }
    } catch {
      setPhoneVerifyError('Invalid or expired code');
    } finally {
      setPhoneVerifying(false);
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
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-black dark:text-white">
                        {user.phone}
                      </div>
                      {user.phoneVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                          Unverified
                        </span>
                      )}
                    </div>

                    {/* Phone verification actions */}
                    {!user.phoneVerified && !phoneOtpSent && (
                      <button
                        onClick={handleSendPhoneOtp}
                        disabled={phoneVerifying}
                        className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {phoneVerifying ? 'Sending...' : 'Verify phone number'}
                      </button>
                    )}

                    {!user.phoneVerified && phoneOtpSent && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={phoneOtpCode}
                          onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit code"
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white text-center text-lg tracking-widest font-bold"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleVerifyPhoneOtp}
                            disabled={phoneVerifying || phoneOtpCode.length !== 6}
                            className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {phoneVerifying ? 'Verifying...' : 'Verify'}
                          </button>
                          <button
                            onClick={() => { setPhoneOtpSent(false); setPhoneOtpCode(''); setPhoneVerifyInfo(''); }}
                            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {phoneVerifyInfo && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
                        {phoneVerifyInfo}
                      </div>
                    )}
                    {phoneVerifyError && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                        {phoneVerifyError}
                      </div>
                    )}
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