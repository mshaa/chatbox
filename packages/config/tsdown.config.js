import { neutralConfig } from '@chatbox/config-tsdown/neutral'
import { defineConfig } from 'tsdown'

export default defineConfig({
  ...neutralConfig,
  entry: ['src/server.ts', 'src/web.ts', 'src/simulator.ts', 'src/bff.ts',],
  outDir: 'dist',
  outExtension: ({ format }) => ({
    js: format === 'esm' ? '.mjs' : '.cjs',
  }),
})
