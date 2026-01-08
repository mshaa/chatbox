import { baseConfig } from '@chatbox/config-vitest/base'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  ...baseConfig,
  test: {
    include: ['**/*.e2e-spec.ts'],
  },
})
