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
export declare function normalizeApiBaseUrl(url: string): string;
export declare function createJsonApiClient(options: CreateJsonApiClientOptions): <T>(endpoint: string, requestOptions?: RequestInit) => Promise<T>;
//# sourceMappingURL=index.d.ts.map