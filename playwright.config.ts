import { defineConfig, devices } from '@playwright/test';

// Test giao diện: Chrome Android (Pixel 7), Safari iOS (iPhone 13, WebKit) và máy tính (Chrome).
// Trên máy không có WebKit (ví dụ máy soạn), đặt PW_NO_WEBKIT=1 để bỏ dự án iPhone; CI luôn chạy đủ cả ba.
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
