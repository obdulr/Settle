FROM node:22-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

# Copy package files (no lockfile — it's at repo root, outside build context)
COPY package.json ./
COPY shared-sdk/package.json ./shared-sdk/

# Create minimal workspace so workspace:* resolves
RUN printf 'packages:\n  - .\n  - shared-sdk\n' > pnpm-workspace.yaml

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Remove stale .next folder
RUN rm -rf .next

# Build
RUN pnpm run build

# Copy static files into standalone output (Next.js doesn't do this automatically)
RUN cp -r .next/static .next/standalone/settle-web/.next/static || true
RUN cp -r public .next/standalone/settle-web/public || true

ENV NODE_ENV=production
ENV PORT=3025
ENV HOSTNAME=0.0.0.0

EXPOSE 3025

CMD ["sh", "-c", "node .next/standalone/settle-web/server.js"]
