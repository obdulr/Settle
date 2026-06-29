# Settle Monorepo

A monorepo containing Settle's web, mobile, and API applications with shared packages.

## Structure

- `settle-api/` - NestJS backend API
- `settle-web/` - Next.js frontend web application
- `settle-mobile/` - Expo React Native mobile application
- `packages/shared/` - Shared types and utilities

## Getting Started

Install dependencies:
```bash
npm install
```

Run development servers:
```bash
# Web
npm run dev

# API
npm run dev:api

# Mobile
npm run dev:mobile
```

Build all projects:
```bash
npm run build
```

## Maintenance

Clean macOS metadata files (._*):
```bash
npm run clean:mac-files
```

Install git hooks (if needed):
```bash
npm run install:hooks
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

## Shared Package

The `@settle/shared` package contains common types and utilities used across all projects. It's automatically linked via npm workspaces.
