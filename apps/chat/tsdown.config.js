import { baseConfig } from '@chatbox/config-tsdown/base'
import { defineConfig } from 'tsdown'

export default defineConfig({
  ...baseConfig,
  entry: ['src/main.ts'],
  outDir: 'dist',

  format: ['cjs'],
  platform: 'node',
  target: 'node22',

  dts: true,
  sourcemap: true,
  clean: true,

  external: [/^@nestjs\//, /^rxjs/],
})
