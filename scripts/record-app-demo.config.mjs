import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: ['**/record-app-demo.spec.mjs'],
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    locale: 'ru',
  },
  outputDir: 'scripts/recording-output',
  reporter: [['list']],
  timeout: 180_000,
  workers: 1,
});
