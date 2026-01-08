import { defineConfig } from 'tsdown';

export const baseConfig = defineConfig({
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false
});