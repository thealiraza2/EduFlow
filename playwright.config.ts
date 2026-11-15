import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    channel: "chrome",
    headless: true,
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      QR_HMAC_SECRET:
        process.env.QR_HMAC_SECRET ||
        "local_dev_qr_hmac_secret_64_bytes_secure_test_key_1234567890",
    },
  },
});
