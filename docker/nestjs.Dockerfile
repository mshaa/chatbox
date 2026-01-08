FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat

FROM base AS builder
ARG SERVICE_NAME
RUN pnpm add -g turbo
WORKDIR /src
COPY . .
# Prune only what we need for this specific service to keep the context light
RUN turbo prune --scope=${SERVICE_NAME} --docker

FROM base AS installer
ARG SERVICE_NAME
WORKDIR /app

COPY --from=builder /src/out/json/ .
COPY --from=builder /src/out/pnpm-lock.yaml ./pnpm-lock.yaml

# OPTIMIZATION: Use a cache mount for the pnpm store. 
# This persists across different service builds!
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --from=builder /src/out/full/ .
COPY turbo.json turbo.json
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=${SERVICE_NAME}... 

# OPTIMIZATION: Use pnpm deploy to create a production-ready folder.
# This eliminates the need to manually copy node_modules and dist.
RUN pnpm --filter=${SERVICE_NAME} --prod deploy --legacy /deploy-app

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Instead of copying the massive monorepo node_modules, 
# we copy the isolated folder created by 'pnpm deploy'
COPY --from=installer --chown=nestjs:nodejs /deploy-app .

# pnpm deploy preserves the structure, so dist is usually in the root of /deploy-app
CMD ["node", "dist/main"]