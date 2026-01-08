import { nestConfig } from '@chatbox/config-tsdown/nest'
import { defineConfig } from 'tsdown'

export default defineConfig({
  ...nestConfig,
  entry: ['src/index.ts'],
  outDir: 'dist',
})
