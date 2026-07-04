import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createJsonApiClient } from '@settle/shared-sdk/auth';

const TOKEN_KEY = '@settle_token';
const USER_KEY = '@settle_user';

class AuthService {
  private static instance: AuthService;
  private currentToken: string | null = null;
  private currentUser: any = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  static async storeToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      // CRITICAL: Write to localStorage synchronously first
      // This allows auth-gate useState initializers to read immediately
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
    AuthService.getInstance().currentToken = token;
  }

  static async getToken(): Promise<string | null> {
    // Return cached value first
    if (AuthService.getInstance().currentToken) {
      return AuthService.getInstance().currentToken;
    }

    if (Platform.OS === 'web') {
      // Synchronous localStorage read first (prevents race conditions)
      const lsToken = typeof window !== 'undefined' 
        ? window.localStorage?.getItem(TOKEN_KEY) 
        : null;
      if (lsToken) return lsToken;
      return await AsyncStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  }

  static async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    AuthService.getInstance().currentToken = null;
  }

  static async storeUser(user: any): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    }
    AuthService.getInstance().currentUser = user;
  }

  static async getUser(): Promise<any> {
    // Return cached value first
    if (AuthService.getInstance().currentUser) {
      return AuthService.getInstance().currentUser;
    }

    if (Platform.OS === 'web') {
      const lsUser = typeof window !== 'undefined' 
        ? window.localStorage?.getItem(USER_KEY) 
        : null;
      if (lsUser) {
        try {
          return JSON.parse(lsUser);
        } catch {
          return null;
        }
      }
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
      return null;
    } else {
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  static async removeUser(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(USER_KEY);
      }
      await AsyncStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
    AuthService.getInstance().currentUser = null;
  }

  static async clearAuth(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  }

  static isAuthenticated(): boolean {
    return !!AuthService.getInstance().currentToken;
  }

  static createAuthClient(config: {
    getBaseUrl: () => Promise<string> | string;
    onUnauthorized?: () => void;
  }) {
    return {
      async login(email: string, password: string) {
        const apiCall = createJsonApiClient({
          getBaseUrl: config.getBaseUrl,
          getToken: () => null,
          onUnauthorized: config.onUnauthorized,
        });

        const response = await apiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (response.success) {
          await this.storeToken(response.accessToken);
          await this.storeUser(response.user);
        }

        return response;
      },

      async register(data: any) {
        const apiCall = createJsonApiClient({
          getBaseUrl: config.getBaseUrl,
          getToken: () => null,
          onUnauthorized: config.onUnauthorized,
        });

        const response = await apiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        if (response.success) {
          await this.storeToken(response.accessToken);
          await this.storeUser(response.user);
        }

        return response;
      },

      async getProfile() {
        const token = await this.getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const apiCall = createJsonApiClient({
          getBaseUrl: config.getBaseUrl,
          getToken: () => token,
          onUnauthorized: config.onUnauthorized,
        });

        return apiCall('/auth/profile', {
          method: 'GET',
        });
      },

      async updateProfile(data: any) {
        const token = await this.getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const apiCall = createJsonApiClient({
          getBaseUrl: config.getBaseUrl,
          getToken: () => token,
          onUnauthorized: config.onUnauthorized,
        });

        const response = await apiCall('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(data),
        });

        if (response) {
          await this.storeUser(response);
        }

        return response;
      },

      async logout() {
        await this.clearAuth();
        if (config.onUnauthorized) {
          config.onUnauthorized();
        }
      },
    };
  }
}

export default AuthService;