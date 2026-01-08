import { getServerConfig } from '@chatbox/config/server'
import { registerAs } from '@nestjs/config'

export const commonConfig = registerAs('common', () => {
  const config = getServerConfig()
  return {
    env: config.NODE_ENV
  }
}) 

export const authConfig = registerAs('auth', () => {
  const config = getServerConfig()
  return {
    jwtSecret: config.AUTH_JWT_SECRET,
    jwtExpiresInSec: config.AUTH_JWT_EXPIRES_IN_SEC,
    socketTokenExpiresInSec: config.AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC,

    refreshTokenExpiresInSec: config.AUTH_REFRESH_TOKEN_EXPIRES_IN_SEC,
    accessTokenExpiresInSec: config.AUTH_ACCESS_TOKEN_EXPIRES_IN_SEC,
    refreshTokenReuseWindowSec: config.AUTH_REFRESH_TOKEN_REUSE_WINDOW_SEC,
    
    argon2MemoryCost: config.AUTH_ARGON2_MEMORY_COST,
    argon2TimeCost: config.AUTH_ARGON2_TIME_COST,
    argon2Parallelism: config.AUTH_ARGON2_PARALLELISM,
  }
})

export const persistenceConfig = registerAs('persistence', () => {
  const config = getServerConfig()
  return {
    storageUrl: config.PERSISTENCE_STORAGE_URL,
    poolMax: config.PERSISTENCE_POOL_MAX,
    loggerEnabled: config.PERSISTENCE_LOGGER_ENABLED,
  }
})

export const queueConfig = registerAs('queue', () => {
  const config = getServerConfig()
  return {
    redis: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
    },
    jobSyncLastReadIntervalMs: config.JOB_SYNC_LAST_READ_INTERVAL_MS,
    persistReadMsgId: config.PERSIST_READ_MSG_ID,
    cacheTtl: {
      roomsDiscover: config.CACHE_TTL_ROOMS_DISCOVER,
      roomMembers: config.CACHE_TTL_ROOM_MEMBERS,
      userProfile: config.CACHE_TTL_USER_PROFILE,
    },
  }
})

export const chatConfig = registerAs('chat', () => {
  const config = getServerConfig()
  return {
    port: config.CHAT_PORT,
    websocketUrl: config.CHAT_WEBSOCKET_URL,
    websocketPath: config.CHAT_WEBSOCKET_PATH,
    websocketAllowedOrigins: config.CHAT_WEBSOCKET_ALLOWED_ORIGINS,
    websocketRateLimit: {
      typingPoints: config.CHAT_WEBSOCKET_RL_TYPING_POINTS,
      typingDuration: config.CHAT_WEBSOCKET_RL_TYPING_DURATION,
      typingBlockDuration: config.CHAT_WEBSOCKET_RL_TYPING_BLOCK_DURATION,
    },
  }
})

export const identityConfig = registerAs('identity', () => {
  const config = getServerConfig()
  return {
    port: config.IDENTITY_PORT,
  }
})

export const securityConfig = registerAs('security', () => {
  const config = getServerConfig()
  return {
    bodySizeLimit: config.SECURITY_BODY_SIZE_LIMIT,
    throttle: {
      enabled: config.THROTTLE_ENABLED,
      ttl: config.THROTTLE_TTL,
      limit: config.THROTTLE_LIMIT,
      authLimit: config.THROTTLE_AUTH_LIMIT,
    },
  }
})

export const metricsConfig = registerAs('metrics', () => {
  const config = getServerConfig()
  return {
    enabled: config.METRICS_ENABLED,
    path: config.METRICS_PATH,
    defaultMetrics: config.METRICS_DEFAULT_METRICS,
  }
})

export const appConfig = {
  auth: authConfig,
  persistence: persistenceConfig,
  queue: queueConfig,
  chat: chatConfig,
  identity: identityConfig,
  security: securityConfig,
  metrics: metricsConfig,
}

export type CommonConfig = ReturnType<typeof commonConfig>
export type AuthConfig = ReturnType<typeof authConfig>
export type PersistenceConfig = ReturnType<typeof persistenceConfig>
export type QueueConfig = ReturnType<typeof queueConfig>
export type ChatConfig = ReturnType<typeof chatConfig>
export type IdentityConfig = ReturnType<typeof identityConfig>
export type SecurityConfig = ReturnType<typeof securityConfig>
export type MetricsConfig = ReturnType<typeof metricsConfig>
export type AppConfig = typeof appConfig
