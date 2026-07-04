# Settle Monorepo

A monorepo containing Settle's web, mobile, and API applications with shared packages, following standardization patterns from the Prime project.

## Structure

- `settle-api/` - NestJS backend API
- `settle-web/` - Next.js frontend web application
- `settle-mobile/` - Expo React Native mobile application
- `packages/shared-sdk/` - Comprehensive SDK (auth, API, types, utils)
- `packages/shared/` - Legacy shared package (being phased out)

## Package Manager

This project uses **pnpm** as the package manager (NOT npm or yarn).

**Requirements:**
- Node.js >= 22.0.0
- pnpm >= 9.0.0

## Getting Started

Install dependencies:
```bash
pnpm install
```

Run development servers:
```bash
# Web
pnpm run dev

# API
pnpm run dev:api

# Mobile
pnpm run dev:mobile
```

Build all projects:
```bash
pnpm run build
```

## Shared SDK

The `@settle/shared-sdk` package contains comprehensive utilities used across all projects:

- **Authentication**: Token management, API client factory
- **API**: Type-safe API clients for all endpoints
- **Types**: Shared TypeScript interfaces
- **Utilities**: Common helper functions

### Usage Example

```typescript
import { createSettleApi } from '@settle/shared-sdk';

const api = createSettleApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  getToken: () => localStorage.getItem('accessToken'),
  onUnauthorized: () => {
    // Handle unauthorized (logout, redirect to login)
  }
});

// Login
const response = await api.auth.login({ email, password });

// Get profile
const profile = await api.auth.profile();
```

## Documentation

- **[FLOWS.md](docs/FLOWS.md)** - Critical authentication flows, API shapes, gotchas
- **[STANDARDIZATION_GUIDE.md](docs/STANDARDIZATION_GUIDE.md)** - Standard patterns across projects
- **[AGENTS.md](AGENTS.md)** - AI agent instructions and patterns

## Deployment

### Railway (API)
- Configuration: `railway.toml`
- Health endpoints: `/health`, `/`
- Port: 4025
- Build: `cd settle-api && npm install && npm run build`
- Start: `cd settle-api && node dist/main`

### Vercel (Web)
- Standard Next.js deployment
- Environment variables in Vercel dashboard
- Automatic deployments on main branch

### EAS (Mobile)
- Configuration: `eas.json`
- Environment variables: `EXPO_PUBLIC_API_URL`

## Maintenance

Clean macOS metadata files (._*):
```bash
pnpm run clean:mac-files
```

Install git hooks (if needed):
```bash
pnpm run install:hooks
```

### Preventing ._ Files

The project includes several measures to prevent macOS metadata files (._*):

1. **Git hooks** - Pre-commit hook prevents ._ files from being committed
2. **Git ignores** - All .gitignore files exclude ._ patterns
3. **Auto-cleanup** - Post-merge and post-checkout hooks automatically clean ._ files
4. **macOS configuration** - Run the configuration script to reduce ._ file creation:

```bash
npm run configure:macos
```

Note: Some ._ files may still be created during certain file operations. The git hooks and cleanup script will handle them automatically.

## Standardization

This project follows standardization patterns from the Prime project to ensure consistency across Settle, Reid, Notyced, and Prime projects. See [STANDARDIZATION_GUIDE.md](docs/STANDARDIZATION_GUIDE.md) for details.
