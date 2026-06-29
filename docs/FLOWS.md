# Settle Critical Flows

This document contains the critical flows for the Settle application. Before changing auth, API, or routing code, read this file first.

## Authentication Flow

### Login Flow
1. POST `/auth/login` with email/password
2. Response: `{ accessToken, refreshToken, expiresIn, user }`
3. Web: Store token in localStorage, user in localStorage
4. Mobile: Store token in AsyncStorage, user in AsyncStorage
5. Navigate to home screen

### Register Flow
1. POST `/auth/register` with email, password, name
2. Response: `{ accessToken, refreshToken, expiresIn, user }`
3. Same storage as login flow
4. Navigate to home screen

### Profile Flow
1. GET `/auth/profile` with Bearer token
2. Response: Flat structure (NOT nested under `user`)
3. Critical: `profileRes.email` (not `profileRes.user.email`)

### Logout Flow
1. POST `/auth/logout` with Bearer token
2. Remove token from storage
3. Remove user from storage
4. Navigate to login screen

## API Response Shapes

### Auth Response
```typescript
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

### Profile Response (FLAT structure)
```typescript
{
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Error Response
```typescript
{
  message: string;
  statusCode: number;
  error?: string;
}
```

## Token Storage

### Web (localStorage)
```typescript
// Token
localStorage.setItem('accessToken', token);
localStorage.getItem('accessToken');

// User
localStorage.setItem('user', JSON.stringify(user));
JSON.parse(localStorage.getItem('user'));
```

### Mobile (AsyncStorage)
```typescript
// Token
await AsyncStorage.setItem('accessToken', token);
await AsyncStorage.getItem('accessToken');

// User
await AsyncStorage.setItem('user', JSON.stringify(user));
JSON.parse(await AsyncStorage.getItem('user'));
```

## Auth Gate Pattern

### Web
```typescript
// Root layout checks token on pathname change
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  const isAuthRoute = pathname.startsWith('/auth');
  const isTabRoute = pathname.startsWith('/(tabs)');

  if (isAuthRoute && token) {
    router.replace('/(tabs)');
  } else if (isTabRoute && !token) {
    router.replace('/auth/login');
  }
}, [pathname]);
```

### Mobile
```typescript
// Similar pattern using AsyncStorage
useEffect(() => {
  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    // Navigation logic
  };
  checkAuth();
}, []);
```

## JWT Strategy

### Payload Structure
```typescript
{
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  address?: string;
}
```

### Validation
- Extract JWT from Authorization header
- Validate using JWT_SECRET environment variable
- Return user payload
- Throw UnauthorizedException on failure

## Critical Gotchas

1. **Profile Response is Flat**: The `/auth/profile` endpoint returns user data directly, NOT nested under a `user` object. This is different from the login response.

2. **Synchronous localStorage Check**: On web, use synchronous localStorage checks to prevent race conditions during route changes.

3. **Token Expiration**: Handle token expiration by checking `expiresIn` and implementing refresh token logic.

4. **CORS Configuration**: Ensure FRONTEND_URL is set correctly for CORS in production.

5. **Environment Variables**: Different variables for web (NEXT_PUBLIC_*) vs backend (no prefix).

## Data Models

### User Entity
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Auth Credentials
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}
```

## Mobile App Routing

### Expo Router Structure
```
app/
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/
│   ├── index.tsx
│   ├── profile.tsx
│   └── settings.tsx
└── _layout.tsx
```

### Navigation Patterns
- Use `router.replace()` for auth redirects
- Use `router.push()` for normal navigation
- Check auth state in root layout

## API Client Usage

### Using Shared SDK
```typescript
import { createSettleApi } from '@settle/shared-sdk';

const api = createSettleApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  getToken: () => localStorage.getItem('accessToken'),
  onUnauthorized: () => {
    // Handle unauthorized (logout, redirect to login)
  }
});

// Usage
const response = await api.auth.login({ email, password });
const profile = await api.auth.profile();
```

## Environment Variables

### Required Variables
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` - API URL (frontend)
- `PORT` - Service port (backend)

### Optional Variables
- `FRONTEND_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

## Health Endpoints

- `/health` - Primary health check
- `/` - Root health check (fallback)

Both endpoints return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "settle-api"
}
```
