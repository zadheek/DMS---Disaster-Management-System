/**
 * Playwright global setup: logs in as admin and saves auth state.
 * Admin tests reference this stored state to skip re-login on every test.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const ADMIN_AUTH_FILE = path.join("playwright", ".auth", "admin.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/admin/login");
  await page.waitForLoadState("networkidle");

  await page.locator('input[type="email"]').fill("admin@disaster.lk");
  await page.locator('input[type="password"]').fill("admin123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("**/admin", { timeout: 15000 });
  await expect(page).toHaveURL(/\/admin$/);

  // Save auth cookies/storage so admin tests can reuse the session
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
