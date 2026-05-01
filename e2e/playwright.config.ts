import { defineConfig, devices } from "@playwright/test";
import {
  TEST_DATABASE_URL,
  TEST_AUTH_SECRET,
  SERVER_URL,
  CLIENT_URL,
  SERVER_PORT,
  CLIENT_PORT,
} from "./test-env";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: CLIENT_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "bun run src/index.ts",
      url: `${SERVER_URL}/api/health`,
      cwd: "../server",
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: String(SERVER_PORT),
        DATABASE_URL: TEST_DATABASE_URL,
        BETTER_AUTH_SECRET: TEST_AUTH_SECRET,
        BETTER_AUTH_URL: SERVER_URL,
        CLIENT_URL: CLIENT_URL,
        NODE_ENV: "test",
      },
    },
    {
      command: `bunx vite --port ${CLIENT_PORT}`,
      url: CLIENT_URL,
      cwd: "../client",
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: SERVER_URL,
      },
    },
  ],
});
