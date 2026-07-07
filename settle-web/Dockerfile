FROM node:22-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

COPY package.json ./
COPY shared-sdk/package.json ./shared-sdk/

RUN printf 'packages:\n  - .\n  - shared-sdk\n' > pnpm-workspace.yaml

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN rm -rf .next

RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=3025

EXPOSE 3025

CMD ["sh", "-c", "pnpm start -- -p 3025"]
