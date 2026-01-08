import { neutralConfig } from '@chatbox/config-tsdown/neutral'
import { defineConfig } from 'tsdown'

export default defineConfig({
  ...neutralConfig,
  entry: ['src/seed/index.ts', 'src/schema/index.ts', 'src/tools/index.ts'],
  external: ['argon2'],
  outDir: 'dist',
})
