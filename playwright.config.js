import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // Setup: runs auth.setup.js first, saves admin session to disk
    {
      name: "setup",
      testMatch: "**/setup/auth.setup.js",
    },
    // Public tests — no auth needed
    {
      name: "public",
      testMatch: "**/public.spec.js",
      use: { ...devices["Desktop Chrome"] },
    },
    // Auth tests — no stored state needed
    {
      name: "auth",
      testMatch: "**/auth.spec.js",
      use: { ...devices["Desktop Chrome"] },
    },
    // Admin tests — depend on setup project for stored session
    {
      name: "admin",
      testMatch: "**/admin.spec.js",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
