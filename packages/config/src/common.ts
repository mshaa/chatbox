import { z } from 'zod'

// @issue: check and remove default values

export const CommonSchema = z.object({
  NODE_ENV: z.enum(["production", "development"])
})

export const SecurityConfigSchema = z.object({
  SECURITY_BODY_SIZE_LIMIT: z.string(),
  THROTTLE_ENABLED: z.string().transform((val) => val === 'true'),
  THROTTLE_TTL: z.coerce.number(),
  THROTTLE_LIMIT: z.coerce.number(),
  THROTTLE_AUTH_LIMIT: z.coerce.number(),
})

export const AuthConfigSchema = z.object({
  AUTH_JWT_SECRET: z
    .string()
    .min(32, 'JWT secret must be at least 32 characters for cryptographic security'),
  AUTH_JWT_EXPIRES_IN_SEC: z.coerce.number(),
  AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC: z.coerce.number(),

  AUTH_REFRESH_TOKEN_EXPIRES_IN_SEC: z.coerce.number(),
  AUTH_ACCESS_TOKEN_EXPIRES_IN_SEC: z.coerce.number(),
  AUTH_REFRESH_TOKEN_REUSE_WINDOW_SEC: z.coerce.number(),

  AUTH_ARGON2_MEMORY_COST: z.coerce.number().min(1024),
  AUTH_ARGON2_TIME_COST: z.coerce.number().min(1),
  AUTH_ARGON2_PARALLELISM: z.coerce.number().min(1),
})

export const PersistenceConfigSchema = z.object({
  PERSISTENCE_STORAGE_URL: z.string(),
  PERSISTENCE_POOL_MAX: z.coerce.number().min(1).max(80),
  PERSISTENCE_LOGGER_ENABLED: z.string().transform((val) => val === 'true'),
})

export const CacheConfigSchema = z.object({
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  JOB_SYNC_LAST_READ_INTERVAL_MS: z.coerce.number(),
  PERSIST_READ_MSG_ID: z.enum(['direct', 'write-behind']),
  CACHE_TTL_ROOMS_DISCOVER: z.coerce.number(),
  CACHE_TTL_ROOM_MEMBERS: z.coerce.number(),
  CACHE_TTL_USER_PROFILE: z.coerce.number(),
})

export const ChatConfigSchema = z.object({
  CHAT_PROTOCOL: z.enum(['http', 'https']),
  CHAT_HOST: z.string(),
  CHAT_PORT: z.coerce.number(),
  CHAT_WEBSOCKET_URL: z.string(),
  CHAT_WEBSOCKET_PATH: z.string(),
  CHAT_WEBSOCKET_ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),
  CHAT_WEBSOCKET_RL_TYPING_POINTS: z.coerce.number().default(10),
  CHAT_WEBSOCKET_RL_TYPING_DURATION: z.coerce.number().default(10),
  CHAT_WEBSOCKET_RL_TYPING_BLOCK_DURATION: z.coerce.number().default(30),
})

export const IdentityConfigSchema = z.object({
  IDENTITY_PROTOCOL: z.enum(['http', 'https']),
  IDENTITY_HOST: z.string(),
  IDENTITY_PORT: z.coerce.number(),
})

export const WebConfigSchema = AuthConfigSchema.pick({
  AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC: true,
})
  .extend({
    NEXT_PUBLIC_WEBSOCKET_URL: z.string(),
    NEXT_PUBLIC_WEBSOCKET_PATH: z.string(),
    NEXT_PUBLIC_PAGE_SIZE: z.coerce.number().min(1).max(100),
  })
  .transform((data) => ({
    NEXT_PUBLIC_WEBSOCKET_URL: data.NEXT_PUBLIC_WEBSOCKET_URL,
    NEXT_PUBLIC_WEBSOCKET_PATH: data.NEXT_PUBLIC_WEBSOCKET_PATH,
    NEXT_PUBLIC_PAGE_SIZE: data.NEXT_PUBLIC_PAGE_SIZE,
    NEXT_PUBLIC_SOCKET_TOKEN_REFRESH_INTERVAL_MS:
      data.AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC * 1000 * 0.8,
  }))

export const BffConfigSchema = AuthConfigSchema.pick({
  AUTH_JWT_EXPIRES_IN_SEC: true,
})
  .merge(CommonSchema)
  .merge(IdentityConfigSchema)
  .merge(ChatConfigSchema)
  .extend({
    AUTH_COOKIE_SECURE: z.string().transform((val) => val === 'true'),
  })
  .transform((data) => ({
    AUTH_JWT_EXPIRES_IN_SEC: data.AUTH_JWT_EXPIRES_IN_SEC,
    IDENTITY_URL: `${data.IDENTITY_PROTOCOL}://${data.IDENTITY_HOST}:${data.IDENTITY_PORT}`,
    CHAT_URL: `${data.CHAT_PROTOCOL}://${data.CHAT_HOST}:${data.CHAT_PORT}`,
    AUTH_COOKIE_SECURE: data.AUTH_COOKIE_SECURE,
  }))

export const MetricsConfigSchema = z.object({
  METRICS_ENABLED: z.string().transform((val) => val === 'true'),
  METRICS_PATH: z.string(),
  METRICS_DEFAULT_METRICS: z.string().transform((val) => val === 'true'),
})

export const SimulatorConfigSchema = z.object({
  SIMULATOR_MAX_BOTS: z.coerce.number().min(1),
  SIMULATOR_MIN_MESSAGE_INTERVAL_MS: z.coerce.number().min(1000),
  SIMULATOR_MAX_MESSAGE_INTERVAL_MS: z.coerce.number().min(1000),
  SIMULATOR_RESPONSE_CHANCE: z.coerce.number().min(0).max(1),
  SIMULATOR_TYPING_INDICATOR_CHANCE: z.coerce.number().min(0).max(1),
  SIMULATOR_MIN_TYPING_DURATION_MS: z.coerce.number().min(500),
  SIMULATOR_MAX_TYPING_DURATION_MS: z.coerce.number().min(500),
  SIMULATOR_ACTIVE_HOURS_START: z.coerce.number().min(0).max(24),
  SIMULATOR_ACTIVE_HOURS_END: z.coerce.number().min(0).max(24),
  SIMULATOR_PRE_SELECTED_ROOM: z.coerce.string().optional(),
  SIMULATOR_BOT_DIST_ACTIVE_CHATTER: z.coerce.number().min(0).max(1),
  SIMULATOR_BOT_DIST_CASUAL_USER: z.coerce.number().min(0).max(1),
  SIMULATOR_BOT_DIST_LURKER: z.coerce.number().min(0).max(1),
  SIMULATOR_BOT_DIST_DM_ENTHUSIAST: z.coerce.number().min(0).max(1),
})
  .merge(PersistenceConfigSchema)
  .merge(ChatConfigSchema)
  .merge(IdentityConfigSchema)
  .merge(CommonSchema)

export const ServerConfigSchema = AuthConfigSchema.merge(PersistenceConfigSchema)
  .merge(CacheConfigSchema)
  .merge(ChatConfigSchema)
  .merge(IdentityConfigSchema)
  .merge(CommonSchema)
  .merge(SecurityConfigSchema)
  .merge(MetricsConfigSchema)

export type ServerConfig = z.infer<typeof ServerConfigSchema>
export type WebConfig = z.infer<typeof WebConfigSchema>
export type BffConfig = z.infer<typeof BffConfigSchema>
export type SimulatorConfig = z.infer<typeof SimulatorConfigSchema>
export type MetricsConfig = z.infer<typeof MetricsConfigSchema>
