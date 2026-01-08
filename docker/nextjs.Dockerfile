FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat

# --- Stage 1: Prune ---
FROM base AS builder
ARG SERVICE_NAME
RUN pnpm add -g turbo
WORKDIR /src
COPY . .
RUN turbo prune --scope=${SERVICE_NAME} --docker

# --- Stage 2: Build ---
FROM base AS installer
ARG SERVICE_NAME
ARG NEXT_PUBLIC_WEBSOCKET_URL
ARG NEXT_PUBLIC_WEBSOCKET_PATH
ARG NEXT_PUBLIC_PAGE_SIZE
ARG NEXT_PUBLIC_AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC

ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL \
    NEXT_PUBLIC_WEBSOCKET_PATH=$NEXT_PUBLIC_WEBSOCKET_PATH \
    NEXT_PUBLIC_PAGE_SIZE=$NEXT_PUBLIC_PAGE_SIZE \
    NEXT_PUBLIC_AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC=$NEXT_PUBLIC_AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC

WORKDIR /app

COPY --from=builder /src/out/json/ .
COPY --from=builder /src/out/pnpm-lock.yaml ./pnpm-lock.yaml

# BuildKit cache mount for faster pnpm installs
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --from=builder /src/out/full/ .
COPY turbo.json turbo.json

# Next.js specific build
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=${SERVICE_NAME}... 

# --- Stage 3: Runner ---
FROM node:22-alpine AS runner
ARG SERVICE_NAME
WORKDIR /app

# Next.js telemetry can slow down start-up; disable it
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to all interfaces in Docker (required for standalone mode)
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# 

# 1. Copy the standalone build (This includes a minimal node_modules)
COPY --from=installer --chown=nextjs:nodejs /app/apps/${SERVICE_NAME}/.next/standalone ./
# 2. Copy static assets and public files (Standalone mode skips these)
COPY --from=installer --chown=nextjs:nodejs /app/apps/${SERVICE_NAME}/.next/static ./apps/${SERVICE_NAME}/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/${SERVICE_NAME}/public ./apps/${SERVICE_NAME}/public

# The entry point for standalone mode is a server.js file
ENV SERVICE_PATH=apps/${SERVICE_NAME}/server.js
CMD node $SERVICE_PATH