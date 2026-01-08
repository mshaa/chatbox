# 1. Base Setup
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat

# 2. Prune Stage
FROM base AS builder
RUN pnpm add -g turbo
WORKDIR /src
COPY . .
# We scope to persistence for the pruning process
RUN turbo prune --scope=@chatbox/persistence --docker

# 3. Installer Stage
FROM base AS installer
WORKDIR /app

COPY --from=builder /src/out/json/ .
COPY --from=builder /src/out/pnpm-lock.yaml ./pnpm-lock.yaml

# OPTIMIZATION: Cache mount for pnpm store
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --from=builder /src/out/full/ .
COPY turbo.json turbo.json

# OPTIMIZATION: Build specifically for the persistence layer
RUN --mount=type=cache,id=turbo,target=/app/.turbo \
    pnpm turbo build --filter=@chatbox/persistence^...

# OPTIMIZATION: Isolated production folder
# NOTE: We do NOT use --prod here if your seed scripts require devDependencies (like ts-node)
RUN pnpm --filter=@chatbox/persistence deploy --legacy /deploy-app

# 4. Runner Stage (The Init Container)
FROM base AS runner
WORKDIR /app

# Security: Run as non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 runner
USER runner

# Copy the isolated workspace
COPY --from=installer --chown=runner:nodejs /deploy-app .

# Execute sequential commands via shell form
# Using 'pnpm' inside /deploy-app works because 'pnpm deploy' 
# recreates the workspace-specific package.json at the root of /deploy-app
CMD pnpm push && pnpm seed:full