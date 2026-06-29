// API service factories following Prime pattern

import { createJsonApiClient } from '../auth';
import type { User, AuthResponse, LoginCredentials, RegisterData } from '../types';

export function createSettleApi(config: {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
}) {
  const client = createJsonApiClient(config);

  return {
    auth: {
      login: (credentials: LoginCredentials) =>
        client.post<AuthResponse>('/auth/login', credentials),
      register: (data: RegisterData) =>
        client.post<AuthResponse>('/auth/register', data),
      logout: () => client.post<void>('/auth/logout', {}),
      profile: () => client.get<User>('/auth/profile'),
    },
    users: {
      getProfile: () => client.get<User>('/users/profile'),
      updateProfile: (data: Partial<User>) =>
        client.put<User>('/users/profile', data),
    },
  };
}
