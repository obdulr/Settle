# Settle Web — Next.js frontend
# Builds from monorepo root, installs workspace deps, builds shared-sdk, then web

FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

# ---- Install deps ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY settle-web/package.json ./settle-web/
COPY packages/shared-sdk/package.json ./packages/shared-sdk/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile=false

# ---- Build ----
FROM deps AS builder
COPY . .
# Build shared-sdk first (web depends on it)
RUN cd packages/shared-sdk && pnpm run build
# Build web
RUN cd settle-web && pnpm run build

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/settle-web/.next ./settle-web/.next
COPY --from=builder /app/settle-web/public ./settle-web/public
COPY --from=builder /app/settle-web/package.json ./settle-web/
COPY --from=builder /app/settle-web/next.config.* ./settle-web/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared-sdk/package.json ./packages/shared-sdk/
COPY --from=builder /app/packages/shared-sdk/dist ./packages/shared-sdk/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/settle-web/node_modules ./settle-web/node_modules

EXPOSE 3025
CMD ["pnpm", "--filter", "settle-web", "start"]
