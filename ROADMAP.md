# Settle In Peace — Roadmap

> **Status Legend:** ✅ Done · 🔄 In Progress · ❌ Not Started
>
> Last updated: July 2025

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

### Infrastructure
- ✅ PostgreSQL database on Railway
- ✅ TypeORM migrations (users, activities, debts, providers, leads)
- ✅ NestJS API deployed on Railway
- ✅ Next.js web service deployed on Railway
- ✅ Health check endpoints (`/health`, `/`)
- ✅ Email service (Resend) with dev console logging
- ✅ SMS service (Telnyx)
- ✅ Stripe integration (in progress)
- ✅ Shared SDK package (`@settle/shared-sdk`)

---

## What's In Progress 🔄

### Marketplace & Matching
- 🔄 Lead quality scoring system (field exists, scoring logic pending)
- 🔄 Full provider dashboard with analytics
- 🔄 Consumer progress tracking portal
- 🔄 Stripe payment processing integration (module exists, needs completion)

### Mobile
- 🔄 Mobile app for consumers (Expo project scaffolded, services in progress)

### WebAuthn
- 🔄 Passkey column migration fix (renaming + type corrections in progress)

---

## What's Pending ❌

### Phase 1 — MVP Completion
- ❌ Resource library / educational content
- ❌ Educational blog articles
- ❌ Debt calculator tools
- ❌ FAQ section
- ❌ Coaching subscription with core tools

### Phase 2 — Marketplace Engine (Weeks 9–16)
- ❌ Real-time provider bidding engine
- ❌ Consumer-provider matching algorithm
- ❌ Provider marketplace subscription billing ($500–$2,500/month seats)
- ❌ Pay-per-lead purchasing with Stripe checkout
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

1. **Complete WebAuthn migration fix** — Run the `FixPasskeyColumns1700000000005` migration to align the database schema with the User entity (rename `passkey_id` → `passkey_credential_id`, change `passkey_public_key` to `bytea`, add `passkey_counter` and `passkey_transports`).

2. **Finish Stripe integration** — Complete payment processing for pay-per-lead purchases and provider subscription billing.

3. **Lead quality scoring** — Implement automated scoring logic based on debt amount, state, employment status, and credit tier.

4. **Coaching subscription** — Build the $49/month coaching product with budget tracker, debt payoff calculator, and goal setting.

5. **Provider matching algorithm** — Connect qualified leads to providers based on debt type, state, and amount thresholds.

6. **Content library** — Create educational blog articles, debt calculators, and FAQ section for SEO and user education.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, Tailwind CSS |
| Backend | NestJS, TypeORM |
| Database | PostgreSQL (Railway) |
| Mobile | Expo / React Native |
| Auth | JWT + Passport + WebAuthn |
| Email | Resend |
| SMS | Telnyx |
| Payments | Stripe |
| Hosting | Railway (API + Web + Postgres) |
| Package Manager | pnpm |
| Monorepo | Turborepo + pnpm workspaces |

---

## Repository Structure

```
Settle/
├── settle-api/          # NestJS backend (port 4025)
│   ├── src/
│   │   ├── entities/    # User, Activity, Debt, Provider, Lead
│   │   ├── migrations/  # TypeORM migrations
│   │   ├── auth/        # Auth, WebAuthn, SMS auth
│   │   ├── debts/       # Debt CRUD
│   │   ├── leads/       # Lead management
│   │   ├── providers/   # Provider management
│   │   └── stripe/      # Payment integration
│   └── .env.example
├── settle-web/          # Next.js frontend (port 3025)
│   └── src/app/         # Assessment, compare, dashboard, portal, etc.
├── settle-mobile/       # Expo mobile app
├── packages/
│   └── shared-sdk/      # @settle/shared-sdk
├── docs/                # Business plan, competitive analysis, flows
└── scripts/             # macOS metadata cleanup, config
```
