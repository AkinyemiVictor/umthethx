# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS build
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max_old_space_size=1536

RUN pnpm -C apps/web build

FROM node:20-bookworm-slim AS runtime
RUN corepack enable

WORKDIR /app
COPY --from=build /app /app

ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "apps/web/scripts/start-web.mjs"]
