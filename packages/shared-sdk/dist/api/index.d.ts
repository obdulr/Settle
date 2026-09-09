import type { User, AuthResponse, LoginCredentials, RegisterData } from '../types';
export declare function createSettleApi(config: {
    getBaseUrl: () => string | Promise<string>;
    getToken: () => string | null | Promise<string | null>;
    onUnauthorized?: () => void;
}): {
    auth: {
        login: (credentials: LoginCredentials) => Promise<AuthResponse>;
        register: (data: RegisterData) => Promise<AuthResponse>;
        logout: () => Promise<void>;
        profile: () => Promise<User>;
    };
    users: {
        getProfile: () => Promise<User>;
        updateProfile: (data: Partial<User>) => Promise<User>;
    };
};
//# sourceMappingURL=index.d.ts.map