<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## SMS Provider: Telnyx ONLY

**NEVER use Twilio.** Twilio is not used in any project. All SMS, MMS, and messaging functionality uses **Telnyx** exclusively.

- Use the Telnyx API (`https://api.telnyx.com/v2/messages`) for sending SMS
- Env vars: `TELNYX_API_KEY`, `TELNYX_FROM_NUMBER`, `TELNYX_MESSAGING_PROFILE_ID`
- Do not suggest, install, or reference Twilio in any code, config, or documentation

# Project Standardization

This project follows the standardization patterns defined in `docs/STANDARDIZATION_GUIDE.md` based on the Prime project architecture.

## Package Manager: pnpm

This project uses **pnpm** as the package manager (NOT npm or yarn).

**Requirements:**
- Node.js >= 22.0.0
- pnpm >= 9.0.0 (prefer 9.15.5)

**Always use pnpm commands:**
- `pnpm install` - Install dependencies
- `pnpm run dev` - Run development
- `pnpm run build` - Build project
- `pnpm add <package>` - Add dependency
- `pnpm add -D <package>` - Add dev dependency

**Never use npm or yarn commands.**

## Deployment Architecture

The project supports multiple deployment targets. The primary setup uses **Render** for both services, with optional **Railway** (backend) and **Cloudflare Pages** (frontend) alternatives.

### Primary: Render (both services)
- **API service** — built from `settle-api/`, configured in `render.yaml`
- **Web service** — built from `settle-web/`, configured in `render.yaml` (uses Next.js `output: "standalone"`)
- **Database** — external PostgreSQL (e.g., Supabase), connected via `DATABASE_URL` set in the Render dashboard

### Alternative: Railway (backend API)
- **API service** — built from `settle-api/`, uses `railway.toml` at repo root with the repo-level `Dockerfile`
- The database is the same external PostgreSQL instance configured via `DATABASE_URL`

### Alternative: Cloudflare Pages (frontend)
- Set `CF_PAGES=1` or `OUTPUT_EXPORT=1` during the build to enable static export (`output: "export"` in `settle-web/next.config.ts`)
- Use `public/_redirects` and `public/_headers` for redirects and headers

## Port Assignments

**Development Port Assignments:**
- **Frontend (settle-web)**: Port 3025
- **Backend (settle-api)**: Port 4025

**Production URLs:**
- **Frontend**: Render web service URL, Cloudflare Pages URL, or custom domain configured in the dashboard
- **Backend**: Render or Railway API service URL configured in the respective dashboard

**Environment Variables:**
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend
- `DATABASE_URL`: PostgreSQL connection string for backend
- `JWT_SECRET`: JWT secret for token generation
- `JWT_REFRESH_SECRET`: JWT refresh token secret

## Key Patterns

1. **Shared SDK**: Use `@settle/shared-sdk` for authentication, API clients, and types
2. **Authentication**: Follow the flows documented in `docs/FLOWS.md`
3. **API Responses**: Profile responses are flat (not nested under `user` object)
4. **Token Storage**: Web uses localStorage, mobile uses AsyncStorage
5. **Health Endpoints**: `/health` and `/` for Railway health checks
6. **File Storage**: Use Railway-compatible storage solutions (local volumes, S3-compatible services)

## Critical Files to Read Before Changes

- `docs/FLOWS.md` - Authentication flows, API shapes, critical gotchas
- `docs/STANDARDIZATION_GUIDE.md` - Standard patterns across projects
- `docs/DATABASE_STORAGE_ARCHITECTURE.md` - Database and storage architecture
- `packages/shared-sdk/` - Shared authentication and API utilities

## macOS Metadata Files Prevention

This project has comprehensive, permanent protection against macOS metadata files (._*):

### Prevention Layers

1. **Git hooks**: Multiple hooks prevent ._ files from being committed or pushed
2. **Auto-cleanup**: Hooks automatically clean ._ files on commit, checkout, and merge
3. **Git ignores**: All .gitignore files exclude ._ patterns and other macOS metadata
4. **Cleanup command**: Run `pnpm run clean:mac-files` to manually clean
5. **macOS config**: Run `./scripts/configure-macos.sh` to reduce ._ file creation at system level

### Git Hooks

- **pre-commit**: Blocks ._ files from being committed and auto-cleans them
- **post-commit**: Auto-cleans ._ files after commit
- **post-checkout**: Auto-cleans ._ files after checkout
- **post-merge**: Auto-cleans ._ files after merge
- **pre-push**: Blocks ._ files from being pushed

### System Configuration

Run `./scripts/configure-macos.sh` to configure macOS to prevent ._ file creation:
- Disables ._ files on network volumes
- Disables ._ files on USB drives
- Disables ._ files on external drives
- Disables Spotlight indexing for external drives

### Manual Cleanup

If you encounter ._ files, run:
```bash
pnpm run clean:mac-files
```

The git hooks will automatically prevent them from being committed and clean them on every git operation.
