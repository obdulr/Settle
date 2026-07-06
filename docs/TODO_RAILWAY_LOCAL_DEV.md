# TODO: Railway Local Dev Setup (PENDING)

## Status: RESOLVED — database connection working

## Solution
The Railway CLI is linked to the Settle project (account: settleinpeacenow@gmail.com).
The correct DATABASE_PUBLIC_URL is:
`postgresql://postgres:buYilpEiumhfPsCWfKIttaENlMRUICCR@hayabusa.proxy.rlwy.net:57943/railway`

## Local dev startup
```bash
cd /Volumes/Os_Sites/Settle/settle-api && pnpm run start:dev
cd /Volumes/Os_Sites/Settle/settle-web && pnpm run dev
```

## Notes
- typeorm must be 0.3.x (not 1.0.0 which is ESM-only and breaks)
- app.module.ts uses synchronize:true in dev mode (no migrations needed locally)
- The old DATABASE_PUBLIC_URL (reseau.proxy.rlwy.net:27359) was from a deleted database and returned HTTP
