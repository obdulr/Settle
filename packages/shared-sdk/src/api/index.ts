// API service factories following Prime pattern

import { createJsonApiClient } from '../auth';
import type { User, AuthResponse, LoginCredentials, RegisterData } from '../types';

export function createSettleApi(config: {
  getBaseUrl: () => string | Promise<string>;
  getToken: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}) {
  const client = createJsonApiClient(config);

  return {
    auth: {
      login: (credentials: LoginCredentials) =>
        client<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        }),
      register: (data: RegisterData) =>
        client<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      logout: () => client<void>('/auth/logout', { method: 'POST', body: '{}' }),
      profile: () => client<User>('/auth/profile', { method: 'GET' }),
    },
    users: {
      getProfile: () => client<User>('/users/profile', { method: 'GET' }),
      updateProfile: (data: Partial<User>) =>
        client<User>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    },
  };
}
