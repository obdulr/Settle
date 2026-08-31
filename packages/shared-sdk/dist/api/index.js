"use strict";
// API service factories following Prime pattern
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSettleApi = createSettleApi;
const auth_1 = require("../auth");
function createSettleApi(config) {
    const client = (0, auth_1.createJsonApiClient)(config);
    return {
        auth: {
            login: (credentials) => client('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            }),
            register: (data) => client('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
            logout: () => client('/auth/logout', { method: 'POST', body: '{}' }),
            profile: () => client('/auth/profile', { method: 'GET' }),
        },
        users: {
            getProfile: () => client('/users/profile', { method: 'GET' }),
            updateProfile: (data) => client('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
        },
    };
}
//# sourceMappingURL=index.js.map