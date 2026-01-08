import { defineConfig } from 'tsdown';
import { baseConfig } from './base.js';

export const nestConfig = defineConfig({
  ...baseConfig,
  format: ['cjs'],
  platform: 'node'
});