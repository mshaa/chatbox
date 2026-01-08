import { defineConfig } from 'tsdown';
import { baseConfig } from './base.js';

export const neutralConfig = defineConfig({
  ...baseConfig,
  format: ['cjs', 'esm'],
  platform: 'neutral'
});