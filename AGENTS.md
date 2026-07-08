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

**Backend**: Railway (PostgreSQL database + NestJS API service)
**Frontend**: Railway (Next.js web service)

Both services are deployed on Railway. The project uses two Railway services:
1. **API service** — built from `settle-api/`, uses `railway.toml` at repo root
2. **Web service** — built from `settle-web/`, uses `settle-web/railway.web.toml`
3. **Postgres service** — Railway-managed PostgreSQL database

The API connects to Postgres via `DATABASE_URL` (auto-injected by Railway).
The web service connects to the API via `NEXT_PUBLIC_API_URL` (set in Railway dashboard).

## Port Assignments

**Development Port Assignments:**
- **Frontend (settle-web)**: Port 3025
- **Backend (settle-api)**: Port 4025

**Production URLs:**
- **Frontend**: Railway web service URL (configured in Railway dashboard)
- **Backend**: Railway API service URL (configured in Railway dashboard)

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
