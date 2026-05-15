import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("admin login page renders correctly", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Admin Sign In")).toBeVisible();
    await expect(page.getByText("Restricted access — administrators only")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("admin login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("admin login with correct credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Email").fill("admin@disaster.lk");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/admin", { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("unauthenticated access to /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });
});
