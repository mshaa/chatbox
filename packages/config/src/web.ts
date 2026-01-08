import { loadConfigSync } from 'zod-config'
import { envAdapter } from 'zod-config/env-adapter'
import { WebConfigSchema, type WebConfig } from './common'

export type { WebConfig }

let _webConfig: WebConfig | undefined

export function getWebConfig(): WebConfig {
  if (!_webConfig) {
    _webConfig = loadConfigSync({
      schema: WebConfigSchema,
      adapters: envAdapter({
        customEnv: {
          NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
          NEXT_PUBLIC_WEBSOCKET_PATH: process.env.NEXT_PUBLIC_WEBSOCKET_PATH,
          NEXT_PUBLIC_PAGE_SIZE: process.env.NEXT_PUBLIC_PAGE_SIZE,
          AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC: process.env.NEXT_PUBLIC_AUTH_SOCKET_TOKEN_EXPIRES_IN_SEC,
        },
      }),
    })
  }
  return _webConfig
}
