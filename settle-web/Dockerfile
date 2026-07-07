FROM node:22-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

# Copy the web package.json and the pre-built shared-sdk
COPY package.json ./
COPY shared-sdk ./shared-sdk

# Create a minimal pnpm-workspace.yaml so workspace:* resolves
RUN printf 'packages:\n  - .\n  - shared-sdk\n' > pnpm-workspace.yaml

# Install dependencies (shared-sdk is resolved as workspace dependency)
RUN pnpm install --frozen-lockfile=false || true

# If workspace install failed, manually link shared-sdk
RUN mkdir -p node_modules/@settle/shared-sdk && \
    cp -r shared-sdk/dist node_modules/@settle/shared-sdk/dist && \
    cp shared-sdk/package.json node_modules/@settle/shared-sdk/package.json || true

# Copy source code
COPY . .

# Remove stale .next folder
RUN rm -rf .next

# Build web
RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=3025

EXPOSE 3025

CMD ["sh", "-c", "pnpm start"]
