# Settle In Peace — Production Readiness Checklist

Use this checklist to take the platform from "builds and runs locally" to "accepting real leads and payments."

## 1. Infrastructure

- [ ] **Provision PostgreSQL database** (Railway, Render, AWS RDS, or Supabase).
- [ ] **Settle API deployment** (Railway/Render): point build/start commands to `settle-api`.
- [ ] **Settle Web deployment** (Railway/Render/Vercel): point build/start commands to `settle-web`.
- [ ] **Custom domain** configured (`settleinpeace.com` or similar) with DNS pointing to deployed services.
- [ ] **SSL/HTTPS** enforced on both API and web.
- [ ] **Environment variables** populated in production (see `settle-api/.env.example`).

## 2. Database

- [ ] Run migrations in production:
  ```bash
  cd settle-api
  npm run migration:run
  # or
  npx ts-node src/migrations/run-migration.ts
  ```
- [ ] Verify all tables exist: `users`, `providers`, `leads`, `matches`, `debts`, `budgets`, `budget_items`, `goals`, `coaching_subscriptions`, `activities`.
- [ ] Create the first **admin user** (see `settle-api/src/scripts/create-admin.ts`).

## 3. Payments (Stripe)

- [ ] Create a **Stripe account** (start in test mode, then switch to live).
- [ ] Create products & prices in Stripe dashboard:
  - **Coaching Subscription** — recurring, $49/month → copy Price ID to `STRIPE_COACHING_PRICE_ID`.
  - **Provider Starter Seat** — recurring, $500/month → `STRIPE_PRICE_PROVIDER_STARTER`.
  - **Provider Growth Seat** — recurring, $1,000/month → `STRIPE_PRICE_PROVIDER_GROWTH`.
  - **Provider Scale Seat** — recurring, $2,500/month → `STRIPE_PRICE_PROVIDER_SCALE`.
  - *(Optional)* Lead credit packages are created dynamically via `price_data`, no Price ID needed.
- [ ] Copy **Stripe Secret Key** to `STRIPE_SECRET_KEY`.
- [ ] Add webhook endpoint in Stripe dashboard pointing to `https://api.settleinpeace.com/stripe/webhook`.
- [ ] Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
- [ ] Subscribe webhook to events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Test checkout flow end-to-end in Stripe test mode.

## 4. Email (Resend)

- [ ] Create **Resend account** and verify domain (`settleinpeace.com`).
- [ ] Generate API key → `RESEND_API_KEY`.
- [ ] Configure `EMAIL_FROM` (e.g. `onboarding@settleinpeace.com`) and `SUPPORT_EMAIL`.
- [ ] Test transactional emails: welcome, verification, password reset, lead match, provider approval.

## 5. Provider Onboarding

- [ ] Create the first providers manually or via `/providers/signup`.
- [ ] Log in as admin and **approve providers** via `/admin/providers/:id/approve` or the admin UI.
- [ ] Optionally seed test providers with credits using `/admin/providers/:id/adjust-credits`.
- [ ] Verify approved providers can log in and view matched leads in `/portal`.

## 6. Lead Flow (Consumer → Provider)

- [ ] Submit assessment at `/assessment` (no login required).
- [ ] Confirm lead appears as `available` in database/API.
- [ ] Confirm matching algorithm runs (`/matching/recommended/:leadId`).
- [ ] Provider logs in, views matched lead, and either:
  - Purchases with existing credits (`/leads/:id/purchase`), or
  - Checks out with Stripe (`/stripe/lead-checkout`).
- [ ] Confirm webhook marks lead as `sold` and unlocks contact details.
- [ ] Confirm provider receives lead-purchase confirmation email.

## 7. Coaching Subscription Flow

- [ ] Consumer registers/logs in.
- [ ] Visits `/coaching` and clicks subscribe.
- [ ] Stripe Checkout redirects to `/portal/billing/success?session_id=xxx`.
- [ ] Webhook records `CoachingSubscription` row and unlocks dashboard tools.
- [ ] Billing portal (`/stripe/billing-portal`) allows cancellation/management.

## 8. Compliance & Trust

- [ ] Review `/disclosures` and `/terms` pages for accuracy.
- [ ] Add required debt-relief disclaimers on homepage and assessment page.
- [ ] Ensure TCPA consent checkbox is shown and recorded.
- [ ] Add privacy policy and state-specific disclosures where required.
- [ ] Consider legal review before launching paid traffic.

## 9. Monitoring & Ops

- [ ] Add error tracking (Sentry, LogRocket, Datadog, etc.).
- [ ] Add uptime monitoring for `/health` on API.
- [ ] Configure backup policy for PostgreSQL.
- [ ] Set up Stripe webhook retry/failure alerts.
- [ ] Document runbook for manual provider approval and credit adjustments.

## 10. Launch Traffic

- [ ] Set up Google Analytics / PostHog on `settle-web`.
- [ ] Connect domain to Google Search Console.
- [ ] Launch small paid-traffic test to `/assessment` (Google Ads, Meta).
- [ ] A/B test headline/CTA on homepage.
- [ ] Track cost per lead and lead-to-purchase conversion rate.

## Revenue Math to Track

| Metric | Target |
|--------|--------|
| Cost per assessment completion | <$30 |
| Lead quality score ≥ 40 | > 60% of leads |
| Lead purchase rate by providers | > 20% of available leads |
| Average lead sale price | $100–$150 |
| Coaching conversion rate | > 3% of registered users |
| Provider subscription take rate | > 10% of active providers |

## Quick Launch Path (Minimum Viable)

If you want revenue **this week**:

1. Deploy API + web to Railway with production env vars.
2. Run migrations and create an admin user.
3. Create Stripe test products and configure price IDs.
4. Register a test provider, approve them, and add test credits.
5. Submit a test assessment and purchase the lead.
6. Switch Stripe to live mode, onboard 1–2 real providers, and drive traffic.
