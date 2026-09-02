'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createJsonApiClient } from '@settle/shared-sdk/auth';
import { startRegistration } from '@simplewebauthn/browser';
import { getStoredToken, getStoredUser, clearAuth, isAuthenticated } from '../../lib/authUtils';
import FirebasePhoneVerify from '../../components/FirebasePhoneVerify';

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

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneVerifyInfo, setPhoneVerifyInfo] = useState('');
  const [phoneVerifyError, setPhoneVerifyError] = useState('');
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState('');

  const checkPasskeyStatus = useCallback(async () => {
    try {
      const apiCall = getApiCall();
      const res = await apiCall<{ hasPasskey: boolean }>('/auth/passkey/status');
      setHasPasskey(res.hasPasskey);
    } catch {
      // Endpoint may not exist yet — silently ignore
    }
  }, []);

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
          phone: response.phone || '',
        });
        checkPasskeyStatus();
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

  const getApiCall = () => {
    const token = getStoredToken();
    return createJsonApiClient({
      getBaseUrl: () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025',
      getToken: () => token,
      onUnauthorized: () => { clearAuth(); router.push('/login'); },
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccessMessage('');
    try {
      const apiCall = getApiCall();
      const response = await apiCall<UserProfile>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setUser(response);
      setSuccessMessage('Profile updated successfully');
      setPhoneOtpSent(false);
      setPhoneOtpCode('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setPhoneVerifying(true);
    setPhoneVerifyError('');
    setPhoneVerifyInfo('');
    try {
      const apiCall = getApiCall();
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

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyMessage('');
    try {
      const apiCall = getApiCall();
      const optionsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025'}/auth/passkey/register/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken()}`,
        },
      });
      const options = await optionsRes.json();
      const credential = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025'}/auth/passkey/register/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({ credential, challenge: options.challenge }),
      });
      const result = await verifyRes.json();
      if (result.verified) {
        setHasPasskey(true);
        setPasskeyMessage('Passkey registered successfully! You can now use it to log in.');
      } else {
        setPasskeyMessage('Failed to register passkey. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setPasskeyMessage('Passkey registration was cancelled');
      } else {
        setPasskeyMessage(err instanceof Error ? err.message : 'Failed to register passkey');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyMessage('');
    try {
      const apiCall = getApiCall();
      await apiCall<{ success: boolean }>('/auth/passkey', { method: 'DELETE' });
      setHasPasskey(false);
      setPasskeyMessage('Passkey removed.');
    } catch {
      setPasskeyMessage('Failed to remove passkey');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setPhoneVerifying(true);
    setPhoneVerifyError('');
    try {
      const apiCall = getApiCall();
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
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
                />
                {user?.phone && editForm.phone === user.phone && (
                  <div className="mt-2 flex items-center gap-2">
                    {user.phoneVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Verified
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                          Unverified
                        </span>
                        {!phoneOtpSent && (
                          process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? (
                            <FirebasePhoneVerify
                              phone={editForm.phone}
                              token={getStoredToken()}
                              onVerified={() => setUser(prev => prev ? { ...prev, phoneVerified: true } : prev)}
                            />
                          ) : (
                            <button
                              onClick={handleSendPhoneOtp}
                              disabled={phoneVerifying}
                              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                            >
                              {phoneVerifying ? 'Sending...' : 'Verify phone number'}
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>
                )}
                {user?.phone && editForm.phone !== user.phone && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Save changes to update your phone number. You&apos;ll need to verify it again.
                  </p>
                )}

                {/* Phone OTP verification */}
                {!phoneOtpSent ? null : (
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
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-black dark:text-white">Passkey</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Use Touch ID, Face ID, or a security key for passwordless login
                    </p>
                  </div>
                  {hasPasskey ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs font-medium rounded-full">
                      Not set up
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {!hasPasskey && (
                    <button
                      onClick={handleRegisterPasskey}
                      disabled={passkeyLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                    >
                      {passkeyLoading ? 'Setting up...' : 'Add Passkey'}
                    </button>
                  )}
                  {hasPasskey && (
                    <button
                      onClick={handleDeletePasskey}
                      disabled={passkeyLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
                    >
                      {passkeyLoading ? 'Removing...' : 'Remove Passkey'}
                    </button>
                  )}
                </div>
                {passkeyMessage && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{passkeyMessage}</p>
                )}
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