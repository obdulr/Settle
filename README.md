# Settle In Peace Monorepo

A comprehensive debt relief and financial coaching platform that helps people settle their debts and find financial peace through multiple pathways.

## Business Model

**Settle In Peace** operates on a three-pillar business model:

### Pillar 1: Debt Settlement (Phase 4 - Later)
- Direct debt settlement services
- Negotiate lump-sum payoffs for clients
- Revenue: 15-25% of enrolled debt
- Requires state licensing and compliance

### Pillar 2: Lead Generation (Phase 1 - Now)
- Referral-based lead generation for licensed debt relief companies
- Content marketing and SEO-driven traffic
- Revenue: $50-$200 per qualified lead
- No licensing required (referral model)

### Pillar 3: Financial Coaching (Phase 1 - Now)
- Subscription-based financial coaching and education
- DIY debt management guidance
- Revenue: $49-$97/month per subscriber
- Budgeting, credit education, negotiation training

## Target Audience

- Individuals struggling with debt (credit cards, personal loans, medical bills)
- People seeking financial education and coaching
- Consumers looking for debt relief options
- Ages 25-55, income $30k-$100k, US-based

## Value Proposition

"Settle in peace" - Double meaning:
- **Emotional**: Finally at peace, no more debt stress or anxiety
- **Financial**: Professional debt settlement services to resolve accounts

## Monorepo Structure

- `settle-api/` - NestJS backend API (Railway + PostgreSQL)
- `settle-web/` - Next.js frontend web application (Render)
- `settle-mobile/` - Expo React Native mobile application
- `packages/shared-sdk/` - Comprehensive SDK (auth, API, types, utils)
- `packages/shared/` - Legacy shared package (being phased out)

## Business Features

### Phase 1: Core Platform (Current)
- User authentication and profile management
- Financial assessment and debt tracking
- Resource library and educational content
- Lead generation for debt relief partners
- Financial coaching subscription management

### Phase 2: Enhanced Features
- Interactive debt payoff calculators
- Credit score monitoring integration
- Budget management tools
- Goal tracking and progress visualization
- Community features and forums

### Phase 3: Advanced Services
- AI-powered debt analysis
- Automated negotiation suggestions
- Credit repair tools
- Investment guidance
- Retirement planning

### Phase 4: Full Debt Settlement
- Licensed debt settlement services
- Direct creditor negotiations
- Legal compliance integration
- Trust account management

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
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4025',
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
- Build: `cd settle-api && pnpm install && pnpm run build`
- Start: `cd settle-api && node dist/main`

### Render (Web)
- Configuration: `render.yaml`
- Port: 3025
- Environment variables in Render dashboard
- Automatic deployments on main branch
- Live URL: https://settle-e700.onrender.com

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
