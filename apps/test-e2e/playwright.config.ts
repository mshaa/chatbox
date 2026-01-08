import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// @issue: obsolete, incomplete tests, local only 
export default defineConfig({
  globalSetup: require.resolve('./src/global.setup.ts'),
  testDir: './src',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',

    trace: 'on-first-retry',
    navigationTimeout: 60_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
      {
        command: 'pnpm dev',
        cwd: path.join(__dirname, '../..'),
        url: 'http://localhost:3000/auth',
        timeout: 300_000,
        stdout: 'pipe',
        reuseExistingServer: true,
      }
    ],
});
