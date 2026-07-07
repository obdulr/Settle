FROM node:22-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

# Copy workspace manifests first (better caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY settle-api/package.json ./settle-api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared-sdk/package.json ./packages/shared-sdk/

# Install dependencies
RUN pnpm install --frozen-lockfile=false

# Copy source code
COPY . .

# Build shared-sdk first (API may depend on it)
RUN cd packages/shared-sdk && pnpm run build || true

# Build API
RUN cd settle-api && pnpm run build

ENV NODE_ENV=production
ENV PORT=4025

EXPOSE 4025

CMD ["sh", "-c", "cd settle-api && node dist/main.js"]
