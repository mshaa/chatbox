import { neutralConfig } from '@chatbox/config-tsdown/neutral'
import { defineConfig } from 'tsdown'

export default defineConfig({
  ...neutralConfig,
  entry: ['src/index.ts'],
  outDir: 'dist',
})
