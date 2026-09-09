// Authentication utilities following Prime pattern

import { clearToken, getToken, setToken } from './auth';

const USER_KEY = 'settle_user_data';
const REFRESH_TOKEN_KEY = 'settle_refresh_token';

export function getStoredToken(): string | null {
  return getToken();
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): any {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: any, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  setToken(token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function storeRefreshToken(refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  clearToken();
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isSecurePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '');
}