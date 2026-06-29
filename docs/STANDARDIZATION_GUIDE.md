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

### Supported Authentication Methods

**Standard Authentication Methods** (from Prime project):
1. **Email/Password** - Traditional login with email and password
2. **WebAuthn/Passkey** - FIDO2 passkey authentication
3. **SMS/OTP** - Firebase-based phone verification
4. **NO Social Login** - No Google, Facebook, or other social OAuth

### Backend Authentication (NestJS)

**Required Files**:
- `src/auth/jwt.strategy.ts` - JWT validation
- `src/auth/local.strategy.ts` - Email/password validation
- `src/auth/guards/` - Auth guards (JwtAuthGuard, RolesGuard, LocalAuthGuard)
- `src/auth/webauthn.service.ts` - Passkey authentication
- `src/auth/webauthn.controller.ts` - Passkey endpoints
- `src/entities/passkey.entity.ts` - Passkey data model
- `src/entities/webauthn-challenge.entity.ts` - Challenge storage

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

### WebAuthn/Passkey Implementation

**Required Endpoints**:
```
POST /auth/passkey/register/options    - Generate registration options
POST /auth/passkey/register/verify    - Verify registration
POST /auth/passkey/authenticate/options - Generate auth options
POST /auth/passkey/authenticate/verify - Verify authentication
GET  /auth/passkey/list/:userId        - List user passkeys
DELETE /auth/passkey/:passkeyId        - Delete passkey
```

**Database Schema**:
```typescript
@Entity('user_passkeys')
export class Passkey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text', name: 'credential_id' })
  credentialId: string;

  @Column({ type: 'bytea', name: 'public_key' })
  publicKey: Buffer;

  @Column({ type: 'integer', default: 0, name: 'sign_count' })
  signCount: number;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::TEXT[]' })
  transports: string[];

  @Column({ type: 'boolean', default: false, name: 'backed_up' })
  backedUp: boolean;

  @Column({ type: 'boolean', default: false, name: 'backup_eligible' })
  backupEligible: boolean;

  @Column({ type: 'text', nullable: true, name: 'device_type' })
  deviceType: string;

  @Column({ type: 'text', default: 'My Passkey' })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt: Date;
}
```

### SMS/OTP Implementation (Firebase)

**Required Environment Variables**:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

**Firebase Functions**:
```typescript
sendVerificationCode(phone, verifier) - Send OTP via Firebase
verifyCode(code) - Verify OTP
initRecaptchaVerifier(containerId) - Initialize reCAPTCHA (web)
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
  
  // Passkey operations
  registerPasskey(options: any): Promise<any>;
  authenticateWithPasskey(options: any): Promise<any>;
  listPasskeys(userId: string): Promise<Passkey[]>;
  deletePasskey(passkeyId: string): Promise<void>;
  
  // SMS/OTP operations
  sendOtp(phone: string): Promise<void>;
  verifyOtp(code: string): Promise<void>;
  
  // Auth state
  isAuthenticated(): Promise<boolean>;
}
```

### Database Schema

**User Entity** (Standard across all projects):
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: true })
  password: string; // Bcrypt hashed

  @Column({ type: 'varchar', length: 50, default: 'customer', nullable: true })
  role?: string;

  // Email verification
  @Column({ name: 'email_verified', type: 'boolean', default: false, nullable: true })
  emailVerified?: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken?: string;

  @Column({ name: 'email_verification_expires', type: 'timestamp', nullable: true })
  emailVerificationExpires?: Date;

  // Phone verification
  @Column({ name: 'phone_verified', type: 'boolean', default: false, nullable: true })
  phoneVerified?: boolean;

  @Column({ length: 20, nullable: true })
  phone: string;

  // Passkey fields
  @Column({ name: 'passkey_id', nullable: true })
  passkeyId?: string;

  @Column({ name: 'passkey_public_key', nullable: true })
  passkeyPublicKey?: string;

  @Column({ name: 'passkey_verified_at', type: 'timestamp', nullable: true })
  passkeyVerifiedAt?: Date;

  // Security fields
  @Column({ name: 'failed_login_attempts', type: 'int', default: 0, nullable: true })
  failedLoginAttempts?: number;

  @Column({ name: 'last_failed_login_at', type: 'timestamp', nullable: true })
  lastFailedLoginAt?: Date;

  @Column({ name: 'lockout_expires_at', type: 'timestamp', nullable: true })
  lockoutExpiresAt?: Date;

  @Column({ name: 'account_locked', type: 'boolean', default: false, nullable: true })
  accountLocked?: boolean;

  @Column({ name: 'last_password_change_at', type: 'timestamp', nullable: true })
  lastPasswordChangeAt?: Date;

  // Password reset
  @Column({ name: 'reset_token', length: 255, nullable: true, select: false })
  resetToken: string;

  @Column({ name: 'reset_token_expires', type: 'timestamp', nullable: true })
  resetTokenExpires: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
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
   - Monorepo structure with npm/pnpm
   - Shared SDK architecture
   - Authentication patterns (Email/Password, WebAuthn, SMS/OTP)
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

## Authentication Implementation Guide

For detailed step-by-step authentication implementation, see [AUTH_IMPLEMENTATION_GUIDE.md](AUTH_IMPLEMENTATION_GUIDE.md).

### Phase 1: Email/Password Authentication (Foundation)
1. Implement JWT strategy with Passport
2. Create Local strategy for email/password validation
3. Set up user entity with password hashing (bcrypt)
4. Implement auth guards (JwtAuthGuard, LocalAuthGuard)
5. Create auth endpoints (register, login, refresh, logout)
6. Add password reset functionality

### Phase 2: WebAuthn/Passkey Authentication
1. Install WebAuthn dependencies: `@simplewebauthn/server`, `@simplewebauthn/browser`
2. Create Passkey entity for credential storage
3. Create WebAuthnChallenge entity for challenge storage
4. Implement WebAuthn service (register, authenticate)
5. Create WebAuthn controller with endpoints
6. Add frontend WebAuthn integration
7. Implement passkey management (list, delete)

### Phase 3: SMS/OTP Authentication
1. Set up Firebase project
2. Install Firebase SDK: `expo-firebase-auth`, `firebase`
3. Configure Firebase environment variables
4. Implement phone verification service
5. Add OTP send/verify endpoints
6. Integrate with registration flow
7. Add phone verification status to user entity

### Phase 4: Security Enhancements
1. Implement account lockout after failed attempts
2. Add email verification flow
3. Implement password strength requirements
4. Add rate limiting on auth endpoints
5. Implement token refresh logic
6. Add audit logging for auth events

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
