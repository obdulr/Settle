FROM node:22-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY shared-sdk/package.json ./shared-sdk/

# Create minimal workspace so workspace:* resolves
RUN printf 'packages:\n  - .\n  - shared-sdk\n' > pnpm-workspace.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile=false

# Copy source code
COPY . .

# Remove stale .next folder
RUN rm -rf .next

# Build
RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=3025

EXPOSE 3025

CMD ["sh", "-c", "node .next/standalone/server.js"]
