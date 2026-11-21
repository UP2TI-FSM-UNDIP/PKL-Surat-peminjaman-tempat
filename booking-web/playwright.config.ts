import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const webDir = process.cwd();
const repoRoot = path.resolve(webDir, '..');
const apiDir = path.join(repoRoot, 'booking-api');
const e2eDb = path.join(apiDir, 'database', 'e2e.sqlite');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:20181/peminjaman-ruang/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'touch database/e2e.sqlite && php artisan config:clear && php artisan migrate:fresh --seed --force && php artisan db:seed --class=E2eRoomSeeder --force && php artisan db:seed --class=E2eUserSeeder --force && php artisan serve --host=127.0.0.1 --port=18000',
      cwd: apiDir,
      url: 'http://127.0.0.1:18000/up',
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        APP_ENV: 'local',
        APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        APP_URL: 'http://127.0.0.1:18000',
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: e2eDb,
        AUTH_DEV_LOGIN: 'true',
        AUTH_LOCAL_LOGIN: 'all',
        FRONTEND_URL: 'http://127.0.0.1:20181,http://localhost:20181',
        FRONTEND_APP_URL: 'http://127.0.0.1:20181/peminjaman-ruang',
        SESSION_DRIVER: 'array',
        CACHE_STORE: 'array',
        QUEUE_CONNECTION: 'sync',
        MAIL_MAILER: 'array',
        FILESYSTEM_DISK: 'local',
        PRIVATE_FILESYSTEM_DRIVER: 'local',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 20181 --strictPort',
      cwd: webDir,
      url: 'http://127.0.0.1:20181/peminjaman-ruang/',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: 'http://127.0.0.1:18000/api',
      },
    },
  ],
});
