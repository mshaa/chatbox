import { loadConfigSync } from 'zod-config'
import { SimulatorConfigSchema, type SimulatorConfig } from './common'

export type { SimulatorConfig }

let _simulatorConfig: SimulatorConfig | undefined

export function getSimulatorConfig(): SimulatorConfig {
  if (!_simulatorConfig) {
    _simulatorConfig = loadConfigSync({
      schema: SimulatorConfigSchema,
    })
  }
  return _simulatorConfig
}
