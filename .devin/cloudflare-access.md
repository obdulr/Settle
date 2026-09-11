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

## Custom Domain Setup (DONE)

Custom domains are configured for the Worker:

- `settleinpeace.com` → Worker `settleinpeace` (custom domain, SSL auto-provisioned)
- `www.settleinpeace.com` → Worker `settleinpeace` (custom domain, SSL auto-provisioned)
- `api.settleinpeace.com` → CNAME to `settle-api.onrender.com` (proxied through Cloudflare)

### Zone Details

- **Zone ID:** `0984d657ead0b063e4dedc4d414892af`
- **Zone Status:** `pending` (nameservers not yet changed at registrar)
- **Cloudflare Nameservers (NEW):** `coby.ns.cloudflare.com`, `liz.ns.cloudflare.com`
- **Previous Nameservers (OLD, from notyced account):** `liv.ns.cloudflare.com`, `nero.ns.cloudflare.com`

### Action Required at Registrar

Change the nameservers for `settleinpeace.com` at the domain registrar:

| Old Nameserver | New Nameserver |
|----------------|----------------|
| `liv.ns.cloudflare.com` | `coby.ns.cloudflare.com` |
| `nero.ns.cloudflare.com` | `liz.ns.cloudflare.com` |

Once the nameservers propagate (can take up to 24-48 hours), the zone status will change from `pending` to `active`, and `settleinpeace.com` / `www.settleinpeace.com` will serve the Worker.

### Email Records (Preserved)

- MX records: `route1/2/3.mx.cloudflare.net` (Cloudflare Email Routing)
- SPF: `v=spf1 include:_spf.mx.cloudflare.net ~all`
- DKIM: `cf2024-1._domainkey` and `default._domainkey`
- DMARC: `v=DMARC1; p=quarantine; ...`

### After Nameserver Propagation

1. Verify `https://settleinpeace.com` loads the frontend
2. Verify `https://api.settleinpeace.com/health` returns 200 from Render
3. Update `CORS_ORIGINS` on the Render API to include `https://www.settleinpeace.com,https://settleinpeace.com`
