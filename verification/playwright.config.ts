import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: '../test-results/framework-verification',
  projects: [
    {
      name: 'unit',
      testMatch: ['vault-token-lifecycle.spec.ts', 'environment-config.spec.ts'],
    },
    {
      name: 'chromium',
      testMatch: 'login-password-locator.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: 'login-password-locator.spec.ts',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: 'login-password-locator.spec.ts',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
