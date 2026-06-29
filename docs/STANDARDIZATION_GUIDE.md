# Project Standardization Guide

Based on Prime project analysis, this guide defines the standard patterns that should be adopted across Settle, Reid, Notyced, and Prime projects for consistency.

## 1. Monorepo Structure

### Standard Structure
```
project-name/
├── project-api/              # NestJS backend API
├── project-web/              # Next.js frontend
├── project-mobile/           # React Native workspace
│   ├── apps/
│   │   ├── main-app/         # Primary mobile app
│   │   └── admin-app/        # Admin mobile app (if needed)
│   └── package.json
├── packages/                 # Shared packages
│   ├── shared-sdk/           # Comprehensive SDK (auth, API, types, utils)
│   ├── shared-services/      # Mobile-specific services
│   └── shared-components/    # Shared UI components (optional)
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # Workspace definitions
├── turbo.json                # Build orchestration
└── nixpacks.toml             # Railway deployment config
```

### Package Manager
- **Standard**: `pnpm` (strictly enforced)
- **Version**: `>=9.0.0`
- **Node Version**: `>=22.0.0` (prefer v24)

### Workspace Configuration
**pnpm-workspace.yaml**:
```yaml
packages:
  - 'project-web'
  - 'project-api'
  - 'project-mobile/packages/*'
  - 'packages/*'
```

## 2. Shared Packages Architecture

### @project/shared-sdk (Primary Shared Package)
**Purpose**: Comprehensive SDK used by both web and mobile apps

**Structure**:
```
packages/shared-sdk/
├── src/
│   ├── auth/              # Authentication utilities
│   ├── api/               # HTTP client and service factories
│   ├── types/             # Shared TypeScript interfaces
│   ├── hooks/             # React hooks
│   ├── constants/         # Application constants
│   └── utils/             # Common utilities
├── package.json
└── tsconfig.json
```

**Key Exports**:
- `createJsonApiClient()` - Configurable API client with token injection
- `normalizeApiBaseUrl()` - URL normalization with fallback
- Comprehensive type definitions for all entities
- Authentication utilities (token management, auth helpers)
- Utility functions (validation, formatting, error handling)

### @project/shared-services (Mobile-Specific)
**Purpose**: Mobile-specific authentication and services

**Key Exports**:
- `authService` - AsyncStorage-based token management
- `authHelpers` - Helper functions for auth operations
- Mobile-specific types and utilities

## 3. Authentication Implementation

### Backend Authentication (NestJS)

**Required Files**:
- `src/auth/jwt.strategy.ts` - JWT validation
- `src/auth/local.strategy.ts` - Email/password validation
- `src/auth/guards/` - Auth guards (JwtAuthGuard, RolesGuard, LocalAuthGuard)
- `src/auth/webauthn.service.ts` - Passkey authentication (optional)

**Standard JWT Payload**:
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

**Standard API Response**:
```typescript
// Login Response
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// Profile Response (FLAT structure, NOT nested)
{
  id: string;
  email: string;
  name: string;
  // ... other user fields directly (NOT under user object)
}
```

### Mobile Authentication

**Auth Service Pattern**:
```typescript
class AuthService {
  // Token management
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
  
  // User management
  getUser(): Promise<User | null>;
  setUser(user: User): Promise<void>;
  removeUser(): Promise<void>;
  
  // Auth operations
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  logout(): Promise<void>;
  
  // Auth state
  isAuthenticated(): Promise<boolean>;
}
```

### API Client Factory

**Standard Pattern**:
```typescript
function createJsonApiClient(config: {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
  timeout?: number;
}): ApiClient;
```

**Features**:
- Automatic Bearer token injection
- 401/403 handling with onUnauthorized callback
- Timeout handling (default 25s)
- Type-safe API responses

## 4. Configuration Patterns

### Railway Deployment (Backend)

**nixpacks.toml**:
```toml
[phases.build]
cmds = ["cd project-api && pnpm install && pnpm run build"]

[phases.setup]
nixPkgs = ['nodejs-24_x', 'pnpm-9_x']

[start]
cmd = "cd project-api && pnpm start"
```

**Health Endpoints**:
- `/health` - Primary health check
- `/api/health` - Fallback health check
- `/` - Root health check

**Environment Variables**:
- `PORT` - Service port
- `NODE_ENV` - Environment
- `DATABASE_URL` - Database connection
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret

### Vercel Deployment (Frontend)

**GitHub Workflow**:
```yaml
name: Vercel Deploy
on:
  push:
    branches: [main, master]
    paths: ['project-web/**', 'packages/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      - run: pnpm install
      - run: pnpm build -- --filter=project-web
      - uses: amondnet/vercel-action@v20
```

### EAS Build (Mobile)

**EAS Configuration**:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

**Required Environment Variables**:
- `EXPO_PUBLIC_API_URL` - API endpoint URL

## 5. Environment Variables

### Root .env.example Structure

**Categorized by service**:
```bash
# SUPABASE (if using)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# STRIPE (if using)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# GOOGLE (if using)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# JWT & AUTHENTICATION
JWT_SECRET=
JWT_REFRESH_SECRET=
ADMIN_SECRET=

# WEBAUTHN (if using)
NEXT_PUBLIC_WEB_AUTHN_RP_ID=
NEXT_PUBLIC_WEB_AUTHN_ORIGIN=

# API & APP
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_URL=
NODE_ENV=development

# EMAIL (if using)
RESEND_API_KEY=
ADMIN_EMAIL=
```

### Mobile App Environment Variables

**Required in each mobile app**:
```bash
EXPO_PUBLIC_API_URL=https://api.project.com
```

## 6. Self-Healing System

### Three-Layer Error Detection

**Layer 1 - Pre-commit (local)**:
- Husky + lint-staged in root package.json
- Runs `eslint --fix` on staged files
- Runs `tsc --noEmit` on changed packages
- Auto-stages fixed files

**Layer 2 - CI Autofix (GitHub)**:
- Workflow: `.github/workflows/autofix.yml`
- Runs on every PR push
- Runs ESLint --fix across all packages
- Commits fix with `[skip ci]`
- Runs TypeScript checks and posts errors as PR comments

**Layer 3 - File Watcher (real-time)**:
- Script: `project-mobile/apps/main-app/scripts/watch-errors.mjs`
- Runs ESLint --fix on file save
- Runs TypeScript checks
- Writes structured error output to `.errors/` directory

## 7. Build Orchestration

### Turbo Configuration

**turbo.json**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env.*local",
    ".env"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## 8. Documentation Standards

### Required Documentation Files

**FLOWS.md** - Critical system flows:
- Authentication flow (login, registration, profile)
- API response shapes (exact field names)
- Token storage and auth gate patterns
- Data models and entities
- Critical gotchas and race conditions

**AGENTS.md** - AI agent instructions:
- Package manager requirements
- Deployment configuration
- Node version requirements
- Health endpoints
- Project structure
- Specialized agents and skills

**STANDARDIZATION_GUIDE.md** - This file
- Standard patterns across projects
- Architecture guidelines
- Configuration standards

## 9. Code Quality Standards

### ESLint Configuration

**Root .eslintrc.js**:
```javascript
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.base.json'
  }
};
```

### Prettier Configuration

**Root .prettierrc**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## 10. Git Hooks

### Required Hooks

**Pre-commit**:
- Remove macOS metadata files (._*)
- Run ESLint --fix on staged files
- Run TypeScript checks

**Post-merge**:
- Clean macOS metadata files
- Install dependencies if needed

**Post-checkout**:
- Clean macOS metadata files
- Install dependencies if needed

## Implementation Priority

1. **High Priority**:
   - Monorepo structure with pnpm
   - Shared SDK architecture
   - Authentication patterns
   - Railway deployment configuration

2. **Medium Priority**:
   - Self-healing system
   - Build orchestration with Turbo
   - Environment variable standardization
   - Documentation standards

3. **Low Priority**:
   - Advanced CI/CD workflows
   - Specialized agent system
   - Advanced monitoring

## Migration Checklist

For each project (Settle, Reid, Notyced):

- [ ] Convert to pnpm monorepo
- [ ] Implement shared SDK structure
- [ ] Standardize authentication patterns
- [ ] Update Railway configuration
- [ ] Implement self-healing system
- [ ] Add Turbo build orchestration
- [ ] Standardize environment variables
- [ ] Create FLOWS.md documentation
- [ ] Update AGENTS.md
- [ ] Implement git hooks
- [ ] Add ESLint/Prettier configuration
- [ ] Standardize health endpoints
