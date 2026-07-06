// Authentication utilities following Prime pattern

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
}

export interface CreateJsonApiClientOptions {
  getBaseUrl: () => string | Promise<string>;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

export function normalizeApiBaseUrl(url: string): string {
  if (!url) return 'http://localhost:3000';
  
  // Remove trailing slash
  const normalized = url.replace(/\/$/, '');
  
  // Ensure protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    return `https://${normalized}`;
  }
  
  return normalized;
}

export function createJsonApiClient(options: CreateJsonApiClientOptions) {
  const timeout = options.timeout || 25000;

  return async function jsonApiCall<T>(
    endpoint: string,
    requestOptions: RequestInit = {}
  ): Promise<T> {
    const [baseUrl, token] = await Promise.all([
      options.getBaseUrl(),
      options.getToken ? options.getToken() : Promise.resolve(null),
    ]);
    
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
    const url = `${normalizedBaseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.defaultHeaders || {}),
      ...(requestOptions.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        if (options.onUnauthorized) {
          options.onUnauthorized();
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error((error as { message?: string }).message || 'Request failed');
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
}