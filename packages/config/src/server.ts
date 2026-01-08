import { loadConfigSync } from 'zod-config'
import { ServerConfigSchema, type ServerConfig } from './common'

export type { ServerConfig }

let _serverConfig: ServerConfig | undefined

export function getServerConfig(): ServerConfig {
  if (!_serverConfig) {
    _serverConfig = loadConfigSync({
      schema: ServerConfigSchema,
    })
  }
  return _serverConfig
}
