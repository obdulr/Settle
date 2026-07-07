"use strict";
// Authentication utilities following Prime pattern
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeApiBaseUrl = normalizeApiBaseUrl;
exports.createJsonApiClient = createJsonApiClient;
function normalizeApiBaseUrl(url) {
    if (!url)
        return 'http://localhost:3000';
    // Remove trailing slash
    const normalized = url.replace(/\/$/, '');
    // Ensure protocol
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        return `https://${normalized}`;
    }
    return normalized;
}
function createJsonApiClient(options) {
    const timeout = options.timeout || 25000;
    return async function jsonApiCall(endpoint, requestOptions = {}) {
        const [baseUrl, token] = await Promise.all([
            options.getBaseUrl(),
            options.getToken ? options.getToken() : Promise.resolve(null),
        ]);
        const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
        const url = `${normalizedBaseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.defaultHeaders || {}),
            ...(requestOptions.headers || {}),
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
                throw new Error(error.message || 'Request failed');
            }
            return response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    };
}
//# sourceMappingURL=index.js.map