<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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

## Key Patterns

1. **Shared SDK**: Use `@settle/shared-sdk` for authentication, API clients, and types
2. **Authentication**: Follow the flows documented in `docs/FLOWS.md`
3. **API Responses**: Profile responses are flat (not nested under `user` object)
4. **Token Storage**: Web uses localStorage, mobile uses AsyncStorage
5. **Health Endpoints**: `/health` and `/` for Railway health checks

## Critical Files to Read Before Changes

- `docs/FLOWS.md` - Authentication flows, API shapes, critical gotchas
- `docs/STANDARDIZATION_GUIDE.md` - Standard patterns across projects
- `docs/DATABASE_STORAGE_ARCHITECTURE.md` - Database and storage architecture
- `packages/shared-sdk/` - Shared authentication and API utilities

## macOS Metadata Files Prevention

This project has multiple layers of protection against macOS metadata files (._*):

1. **Git hooks**: Pre-commit hook blocks ._ files from being committed
2. **Auto-cleanup**: Post-merge and post-checkout hooks automatically clean ._ files
3. **Git ignores**: All .gitignore files exclude ._ patterns
4. **Cleanup command**: Run `pnpm run clean:mac-files` to manually clean
5. **macOS config**: Run `./scripts/configure-macos.sh` to reduce ._ file creation

If you encounter ._ files, run the cleanup command. The git hooks will prevent them from being committed.
