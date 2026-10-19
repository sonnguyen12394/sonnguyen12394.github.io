import { defineConfig, devices } from '@playwright/test';

// Test giao diện: người sáng lập 19/10/2026 chốt mọi lần kiểm chỉ chạy trên iPhone, dự án ios-safari (iPhone 13, WebKit = Cốc Cốc trên iPhone),
// cả máy soạn lẫn CI: `npm run e2e` (= --project=ios-safari). Hai dự án Chrome (Pixel 7, máy tính) giữ lại chỉ để bật lại khi người sáng lập yêu cầu.
const projects = [
  { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
  { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
  ...(process.env.PW_NO_WEBKIT ? [] : [{ name: 'ios-safari', use: { ...devices['iPhone 13'] } }]),
];

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:8099/', serviceWorkers: 'allow', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' },
  webServer: { command: 'node tools/serve.mjs 8099', url: 'http://localhost:8099/', reuseExistingServer: !process.env.CI },
  projects,
});
