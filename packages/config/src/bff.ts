import { loadConfigSync } from 'zod-config'
import { BffConfigSchema, type BffConfig } from './common'

export type { BffConfig }

let _bffConfig: BffConfig | undefined

export function getBffConfig(): BffConfig {
  if (!_bffConfig) {
    _bffConfig = loadConfigSync({
      schema: BffConfigSchema,
    })
  }
  return _bffConfig
}