# SettleInPeace — Cloudflare Access

## Cloudflare Account

- **Account:** Settleinpeacenow@gmail.com's Account
- **Account ID:** `23b969235059f30399650fc6ae16b77a`
- **API Token:** Stored in env var `CLOUDFLARE_API_TOKEN` (never commit)
- **Token Permissions:** Workers Scripts:Edit, Cloudflare Pages:Edit, Workers Agents Configuration:Edit, Workers Routes:Edit, Zone:Edit, DNS:Edit, Page Rules:Edit, Email Sending:Edit, Email Routing Addresses:Edit, Email Routing Rules:Edit

## Cloudflare Worker

- **Worker Name:** `settleinpeace`
- **Worker URL:** `https://settleinpeace.settleinpeace.workers.dev`
- **workers.dev subdomain:** `settleinpeace`
- **Runtime:** `nodejs_compat`
- **Compatibility Date:** `2025-01-01`
- **Environment Variables:** `NEXT_PUBLIC_API_URL=https://api.settleinpeace.com`
- **Worker Secrets:** `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

## Deployment Commands

```bash
# Build for Cloudflare Workers (builds shared-sdk + Next.js + OpenNext bundle)
cd settle-web && pnpm cf:build

# Deploy to Cloudflare Workers
cd settle-web && CLOUDFLARE_API_TOKEN=<token> pnpm cf:deploy

# Preview locally
cd settle-web && pnpm cf:preview
```

## Config Files

- `settle-web/wrangler.jsonc` — Worker configuration
- `settle-web/open-next.config.ts` — OpenNext adapter config
- `settle-web/scripts/cf-build.sh` — Build script (handles monorepo + AppleDouble cleanup)

## Custom Domain Setup (future)

To point `www.settleinpeace.com` at the Worker:
1. Add the zone `settleinpeace.com` to Cloudflare (if not already)
2. Add routes to `wrangler.jsonc`:
   ```jsonc
   "routes": [
     { "pattern": "settleinpeace.com/*", "custom_domain": true },
     { "pattern": "www.settleinpeace.com/*", "custom_domain": true }
   ]
   ```
3. Redeploy: `pnpm cf:deploy`
4. Update CORS_ORIGINS on the Render API to include the custom domain
