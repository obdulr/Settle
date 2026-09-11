# Settle In Peace — Roadmap

> **Status Legend:** ✅ Done · 🔄 In Progress · ❌ Not Started
>
> Last updated: September 2026

## Current Status Summary

Settle In Peace is a two-sided debt relief marketplace connecting consumers with vetted providers. The platform is built on a monorepo with three packages: `settle-api` (NestJS backend), `settle-web` (Next.js frontend), and `settle-mobile` (Expo/React Native app). The core MVP infrastructure is in place — authentication, user profiles, lead capture, provider portal, and debt tracking are functional. The marketplace matching engine, coaching subscription, and advanced analytics are the next priorities.

---

## What's Done ✅

### Authentication & Security
- ✅ Email/password registration and login (JWT + refresh tokens)
- ✅ Email verification flow
- ✅ Password reset flow
- ✅ OTP via email authentication
- ✅ SMS authentication via Telnyx
- ✅ WebAuthn / passkey registration and authentication
- ✅ Account lockout and brute-force protection (failed login attempts, lockout expiry)
- ✅ JWT guards and Passport strategies

### User & Profile Management
- ✅ User entity with full profile fields (name, phone, role)
- ✅ Profile update endpoints
- ✅ Activity logging (login, register, profile_update, password_reset)

### Debt Management
- ✅ Debt entity (creditor, balance, type, status, interest rate, due date)
- ✅ CRUD endpoints for user debts
- ✅ Debt dashboard page in web frontend

### Lead Generation
- ✅ Lead entity with full qualification fields (debt amount, state, employment, credit score, months behind, bankruptcy)
- ✅ Lead quality scoring field
- ✅ Lead status lifecycle (new, available, sold, converted, rejected, expired)
- ✅ TCPA consent capture and timestamp
- ✅ Assessment quiz page (web) → lead capture
- ✅ Lead source and UTM tracking

### Sales CRM
- ✅ Sales agent role and auth
- ✅ Sales lead pipeline (new, contacted, interested, converted, rejected)
- ✅ Sales CRM dashboard with list and pipeline views (`/sales`, `/dashboard` for sales role)
- ✅ Lead status updates with notes and activity timeline
- ✅ Sales lead stats (total, new, contacted, converted, conversion rate)
- ✅ Admin sales agent management (`/admin/sales-agents`)
- ✅ Admin sales CRM view (`/admin/sales`)

### Debt Collections
- ✅ Collection accounts with full lifecycle (new, active, contacted, payment_plan, settled, paid_in_full, litigation, charge_off, bankruptcy, deceased, closed)
- ✅ Debtor profiles
- ✅ Skip trace functionality
- ✅ Call logs and dialer integration
- ✅ Credit reports and background checks
- ✅ Collection notes and account assignment
- ✅ Collections page (`/collections`) with filtering and priority management

### Financial Coaching
- ✅ Coaching subscription via Stripe
- ✅ Budget management (budgets, expenses, recurring items)
- ✅ Goal tracking (debt payoff, savings, emergency fund)
- ✅ Coaching dashboard with summary metrics
- ✅ Coaching page (`/coaching`)

### Provider Marketplace (Foundation)
- ✅ Provider entity with full company profile (services, debt types, states served, pricing, reputation, membership)
- ✅ Provider auth and portal
- ✅ Provider landing page (web)
- ✅ Provider portal with lead dashboard
- ✅ Provider portal billing and settings pages
- ✅ Lead purchase flow (purchasedBy, salePrice, purchasedAt, expiresAt)

### Frontend Pages
- ✅ Homepage with value proposition
- ✅ Assessment quiz (multi-step lead capture)
- ✅ Provider comparison page
- ✅ Consumer dashboard
- ✅ Debts management page
- ✅ Login / Register / Forgot password / Reset password
- ✅ Profile and settings pages
- ✅ Privacy and Terms pages
- ✅ Provider portal (leads, billing, settings)
- ✅ Sales CRM dashboard with lead pipeline management (`/sales`, `/dashboard` for sales role)
- ✅ Debt collections management page (`/collections` — accounts, debtor profiles, skip traces, call logs, dialer, credit reports, background checks)
- ✅ Admin dashboard with sales agent management (`/admin`, `/admin/sales`, `/admin/sales-agents`)
- ✅ CRM center (`/crm`)
- ✅ Educational content library (`/learn` with `generateStaticParams` for SEO)
- ✅ Financial coaching subscription page (`/coaching`)
- ✅ Debt calculators page (`/calculators`)
- ✅ Disclosures page (`/disclosures`)

### Infrastructure
- ✅ PostgreSQL database (external, Supabase)
- ✅ TypeORM migrations (users, activities, debts, providers, leads, collections, coaching)
- ✅ NestJS API deployed on Render
- ✅ Next.js web deployed on Cloudflare Workers via OpenNext (`https://settleinpeace.settleinpeace.workers.dev`)
- ✅ Health check endpoints (`/health`, `/`)
- ✅ Email service (Resend) with dev console logging
- ✅ SMS service (Telnyx)
- ✅ Stripe integration (coaching subscriptions, lead purchases, provider subscriptions)
- ✅ Shared SDK package (`@settle/shared-sdk`)
- ✅ Firebase Phone Authentication (client-side, alternative to Telnyx OTP)

---

## What's In Progress 🔄

### Marketplace & Matching
- 🔄 Lead quality scoring system (field exists, automated scoring logic pending)
- 🔄 Full provider dashboard with analytics
- 🔄 Consumer progress tracking portal

### Mobile
- 🔄 Mobile app for consumers (Expo project scaffolded, services in progress)

---

## What's Pending ❌

### Phase 1 — MVP Completion
- ❌ FAQ section

### Phase 2 — Marketplace Engine (Weeks 9–16)
- ❌ Real-time provider bidding engine
- ❌ Consumer-provider matching algorithm
- ❌ Premium placement / listing upgrades for providers

### Phase 3 — Intelligence (Weeks 17–24)
- ❌ AI debt analysis and recommendation engine
- ❌ Credit score monitoring integration
- ❌ Automated credit recovery roadmap
- ❌ Community features and peer support
- ❌ Budget management and goal tracking
- ❌ Debt payoff calculators (avalanche/snowball)
- ❌ Progress visualization
- ❌ Video tutorials, webinars, downloadable guides, email courses

### Phase 4 — Full Debt Settlement (Weeks 25+)
- ❌ State licensing applications
- ❌ Legal compliance systems
- ❌ Trust account setup
- ❌ Insurance and bonding
- ❌ Creditor negotiation tools
- ❌ Trust account management
- ❌ Client communication portal
- ❌ Document management system

### Legal & Compliance
- ❌ CFPB-compliant disclosures on all pages
- ❌ Tax implications calculator for forgiven debt
- ❌ Third-party verified provider reviews
- ❌ FTC Telemarketing Sales Rule compliance automation
- ❌ State-specific debt settlement disclosures
- ❌ Provider vetting automation (AFCC/IAPDA membership, state licensing, BBB rating)

---

## Next Steps (Immediate Priorities)

1. **Custom domain** — Point `www.settleinpeace.com` at the Cloudflare Worker by adding routes to `wrangler.jsonc` (see `.devin/cloudflare-access.md`).

2. **CORS configuration** — Add the Cloudflare Workers URL (or custom domain) to `CORS_ORIGINS` on the Render API so the frontend can authenticate against the backend.

3. **Lead quality scoring** — Implement automated scoring logic based on debt amount, state, employment status, and credit tier.

4. **Provider matching algorithm** — Connect qualified leads to providers based on debt type, state, and amount thresholds.

5. **Content library expansion** — Continue creating educational blog articles and debt calculators for SEO and user education.

6. **Mobile app** — Complete the Expo mobile app for consumers.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.3.5, Tailwind CSS |
| Frontend Hosting | Cloudflare Workers (OpenNext `@opennextjs/cloudflare`) |
| Backend | NestJS, TypeORM |
| Backend Hosting | Render |
| Database | PostgreSQL (Supabase) |
| Mobile | Expo / React Native |
| Auth | JWT + Passport + WebAuthn + Firebase Phone |
| Email | Resend |
| SMS | Telnyx |
| Payments | Stripe |
| Package Manager | pnpm |
| Monorepo | Turborepo + pnpm workspaces |

---

## Repository Structure

```
Settle/
├── settle-api/          # NestJS backend (port 4025, deployed on Render)
│   ├── src/
│   │   ├── entities/    # User, Activity, Debt, Provider, Lead, CollectionAccount, etc.
│   │   ├── migrations/  # TypeORM migrations
│   │   ├── auth/        # Auth, WebAuthn, SMS auth, Firebase
│   │   ├── debts/       # Debt CRUD
│   │   ├── leads/       # Lead management
│   │   ├── providers/   # Provider management
│   │   ├── sales/       # Sales CRM (leads, stats, notes, status)
│   │   ├── collections/ # Debt collections (accounts, skip traces, call logs, dialer)
│   │   ├── crm/         # CRM center (debt settlement service)
│   │   ├── coaching/    # Financial coaching (budgets, goals, subscriptions)
│   │   ├── billing/     # Deposits and billing
│   │   └── stripe/      # Payment integration
│   └── .env.example
├── settle-web/          # Next.js frontend (port 3025, deployed on Cloudflare Workers)
│   ├── src/app/         # Assessment, compare, dashboard, portal, sales, collections, etc.
│   ├── scripts/cf-build.sh  # Cloudflare Workers build script
│   ├── wrangler.jsonc   # Worker configuration
│   └── open-next.config.ts  # OpenNext adapter config
├── settle-mobile/       # Expo mobile app
├── packages/
│   └── shared-sdk/      # @settle/shared-sdk
├── docs/                # Business plan, competitive analysis, flows
├── .devin/              # Cloudflare access docs, skills
└── scripts/             # macOS metadata cleanup, config
```
