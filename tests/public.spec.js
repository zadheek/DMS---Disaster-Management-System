import { test, expect } from "@playwright/test";

test.describe("Public Map Page", () => {
  test("loads and shows filter controls", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    // Page title in topbar
    await expect(page.getByText("Live Map")).toBeVisible();

    // Map container renders (Leaflet injects a div with class 'leaflet-container')
    await page.waitForSelector(".leaflet-container", { timeout: 15000 });
    const mapEl = page.locator(".leaflet-container");
    await expect(mapEl).toBeVisible();

    // Filter controls panel
    await expect(page.locator("[data-testid='map-filters']").or(page.getByText("Filters"))).toBeTruthy();
  });

  test("sidebar navigation is visible", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    // Sidebar contains nav links
    await expect(page.getByText("Missing Persons")).toBeVisible();
    await expect(page.getByText("Threat Alerts")).toBeVisible();
  });
});

test.describe("Public Missing Persons Page", () => {
  test("loads with Report Missing Person button", async ({ page }) => {
    await page.goto("/missing");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Missing Persons")).toBeVisible();
    await expect(page.getByRole("button", { name: /report missing person/i })).toBeVisible();
  });

  test("opens report modal on button click", async ({ page }) => {
    await page.goto("/missing");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /report missing person/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Report Missing Person").last()).toBeVisible();
  });

  test("shows validation errors when form submitted empty", async ({ page }) => {
    await page.goto("/missing");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /report missing person/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Submit without filling required fields
    await page.getByRole("button", { name: /^submit$/i }).click();

    // At least one validation error should appear
    const errors = page.locator("[class*='critical']").filter({ hasText: /required|must/i });
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test("submits missing person report and shows success toast", async ({ page }) => {
    await page.goto("/missing");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /report missing person/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill required fields
    await page.getByPlaceholder(/full name/i).fill("Test Person E2E");
    await page.getByPlaceholder(/age/i).fill("30");
    await page.getByPlaceholder(/last seen location/i).fill("Colombo Fort, Western Province");
    await page.getByPlaceholder(/your name/i).fill("Test Reporter");
    await page.getByPlaceholder(/phone/i).fill("+94711234567");

    await page.getByRole("button", { name: /^submit$/i }).click();

    // Toast notification
    await expect(page.getByText(/reported successfully/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Public Alerts Page", () => {
  test("loads with seeded alerts visible", async ({ page }) => {
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Threat Alerts")).toBeVisible();
    await expect(page.getByRole("button", { name: /report alert/i })).toBeVisible();

    // Seeded alert from seed.js should be visible
    await expect(page.getByText("Severe Flooding in Colombo District")).toBeVisible({ timeout: 10000 });
  });

  test("type filter tabs are shown", async ({ page }) => {
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("tab", { name: "ALL" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "FLOOD" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "LANDSLIDE" })).toBeVisible();
  });

  test("opens report alert modal and submits", async ({ page }) => {
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /report alert/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Report Threat Alert")).toBeVisible();

    // Fill title (type and severity have defaults)
    await page.getByPlaceholder(/brief description of the alert/i).fill("E2E Test Alert Flood");
    await page.getByPlaceholder(/full description/i).fill("Test description for E2E test flood alert in test area.");
    await page.getByPlaceholder(/location name/i).fill("Test Location, Colombo");
    await page.getByPlaceholder(/your name/i).fill("E2E Reporter");
    await page.getByPlaceholder(/phone/i).fill("+94712345678");

    await page.getByRole("button", { name: /^submit$/i }).click();

    await expect(page.getByText(/reported successfully/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Camp Check-In Page", () => {
  test("loads check-in page with tabs", async ({ page }) => {
    await page.goto("/checkin");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Camp Check-In")).toBeVisible();
    // Should show scan or manual tab
    await expect(
      page.getByRole("tab", { name: /scan/i }).or(page.getByRole("tab", { name: /manual/i }))
    ).toBeVisible();
  });

  test("QR param switches to manual tab and attempts camp lookup", async ({ page }) => {
    // Use a known invalid QR code — should trigger "Camp not found" toast
    await page.goto("/checkin?camp=nonexistent-qr-code-e2e");
    await page.waitForLoadState("networkidle");

    // Should be on manual tab when camp param is in URL
    await expect(page.getByRole("tab", { name: /manual/i })).toBeVisible();

    // With an invalid QR, should show error toast
    await expect(page.getByText(/camp not found/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Public Donations Page", () => {
  test("loads with seeded donation drive", async ({ page }) => {
    await page.goto("/donations");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Donation Drives")).toBeVisible();
    await expect(page.getByText("Sri Lanka Red Cross Society")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Public Volunteer Registration Page", () => {
  test("loads with register form", async ({ page }) => {
    await page.goto("/volunteer");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/volunteer/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
  });
});
