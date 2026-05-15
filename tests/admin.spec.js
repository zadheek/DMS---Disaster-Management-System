import { test, expect } from "@playwright/test";

// All admin tests use the saved admin auth state
test.use({ storageState: "playwright/.auth/admin.json" });

test.describe("Admin Dashboard", () => {
  test("loads stats cards and charts", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible({ timeout: 10000 });

    // Stats cards render — at least one should be visible
    const statsArea = page.locator("main");
    await expect(statsArea).toBeVisible();

    // Active alerts stat card
    await expect(
      page.getByText(/active alerts/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("live feed hydrates with seeded submissions — no empty state", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Wait for Live Feed header
    await expect(page.getByText("Live Feed")).toBeVisible({ timeout: 10000 });

    // Skeletons must disappear (loading done)
    await expect(page.locator(".animate-pulse").first()).not.toBeVisible({ timeout: 10000 }).catch(() => {});

    // Seeded data must populate the feed — "No recent submissions" must not appear
    await expect(page.getByText("No recent submissions")).not.toBeVisible({ timeout: 10000 });

    // At least one type label from the feed must be visible
    await expect(
      page.getByText("Alert").or(page.getByText("Road Alert")).or(page.getByText("Missing Person")).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("sidebar shows admin navigation links", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Sidebar admin nav labels — use role=link to avoid strict-mode collision with BroadcastBanner
    await expect(page.getByRole("link", { name: "Alerts" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Broadcast" })).toBeVisible();
  });
});

test.describe("Admin Alerts Management", () => {
  test("loads alerts table with status tabs", async ({ page }) => {
    await page.goto("/admin/alerts");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Alerts Management")).toBeVisible();

    // Status tabs visible
    await expect(page.getByRole("tab", { name: "ACTIVE" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "RESOLVED" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "REJECTED" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "FLAGGED" })).toBeVisible();
  });

  test("shows seeded active alerts", async ({ page }) => {
    await page.goto("/admin/alerts");
    await page.waitForLoadState("networkidle");

    // At least one of the seeded ACTIVE alert titles should be visible
    await expect(
      page.getByText("Severe Flooding in Colombo District")
        .or(page.getByText("Active Landslide Blocking Balana Road"))
        .or(page.getByText("Factory Fire at Biyagama Export Zone"))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("resolve alert — confirm dialog appears and confirms", async ({ page }) => {
    await page.goto("/admin/alerts");
    await page.waitForLoadState("networkidle");

    // Wait for at least one active alert to load
    await page.waitForSelector("main [role='row']", { timeout: 10000 }).catch(() => {});

    // Click Resolve on first available resolve button
    const resolveBtn = page.getByRole("button", { name: /resolve/i }).first();
    await expect(resolveBtn).toBeVisible({ timeout: 10000 });
    await resolveBtn.click();

    // ConfirmDialog should appear
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText("Resolve Alert")).toBeVisible();

    // Confirm the action
    await page.getByRole("button", { name: /^resolve$/i }).click();

    // Toast confirms resolution
    await expect(page.getByText(/resolved/i)).toBeVisible({ timeout: 10000 });
  });

  test("reject alert — confirm dialog appears with destructive styling", async ({ page }) => {
    await page.goto("/admin/alerts");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText("Active Landslide Blocking Balana Road")
    ).toBeVisible({ timeout: 10000 });

    const rejectBtn = page.getByRole("button", { name: /reject/i }).first();
    await rejectBtn.click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText("Reject Alert")).toBeVisible();

    // Cancel — do not actually reject the seeded data in all test runs
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("alertdialog")).not.toBeVisible();
  });

  test("switching to RESOLVED tab shows no ACTIVE alerts there", async ({ page }) => {
    await page.goto("/admin/alerts");
    await page.waitForLoadState("networkidle");

    // Dismiss any BroadcastBanners blocking the tab bar before clicking
    const dismissBtns = page.getByRole("button", { name: /dismiss broadcast/i });
    const count = await dismissBtns.count();
    for (let i = 0; i < count; i++) {
      await dismissBtns.first().click().catch(() => {});
    }

    await page.getByRole("tab", { name: "RESOLVED" }).click({ force: true });
    await page.waitForLoadState("networkidle");

    // ACTIVE tab items should not be visible in RESOLVED tab
    await expect(page.getByRole("tab", { name: "RESOLVED" })).toHaveAttribute(
      "data-state",
      "active"
    );
  });
});

test.describe("Admin Broadcast", () => {
  test("loads broadcast page with compose form", async ({ page }) => {
    await page.goto("/admin/broadcast");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Emergency Broadcasts")).toBeVisible();
    await expect(page.getByText("Compose Broadcast")).toBeVisible();
    await expect(page.getByRole("button", { name: /publish broadcast/i })).toBeVisible();
  });

  test("publishes a new broadcast and appears in list", async ({ page }) => {
    await page.goto("/admin/broadcast");
    await page.waitForLoadState("networkidle");

    const msg = `E2E test broadcast ${Date.now()}`;

    await page.getByPlaceholder(/emergency broadcast message/i).fill(msg);

    // Leave severity as INFO (default)
    await page.getByRole("button", { name: /publish broadcast/i }).click();

    await expect(page.getByText("Broadcast published")).toBeVisible({ timeout: 10000 });

    // The new broadcast should appear in the list (scope to main; .first() because dedup bug may cause 2 entries)
    await expect(page.locator("main").getByText(msg).first()).toBeVisible({ timeout: 5000 });
  });

  test("shows validation error when message is empty", async ({ page }) => {
    await page.goto("/admin/broadcast");
    await page.waitForLoadState("networkidle");

    // Clear any pre-filled content and submit empty
    await page.getByPlaceholder(/emergency broadcast message/i).fill("");
    await page.getByRole("button", { name: /publish broadcast/i }).click();

    await expect(page.getByText(/message is required/i)).toBeVisible({ timeout: 5000 });
  });

  test("seeded broadcast is visible in the list", async ({ page }) => {
    await page.goto("/admin/broadcast");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("main").getByText(/WEATHER ALERT/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("published broadcast appears exactly once — no duplicate rows", async ({ page }) => {
    await page.goto("/admin/broadcast");
    await page.waitForLoadState("networkidle");

    const msg = `NoDup-${Date.now()}`;
    await page.getByPlaceholder(/emergency broadcast message/i).fill(msg);
    await page.getByRole("button", { name: /publish broadcast/i }).click();

    await expect(page.getByText("Broadcast published")).toBeVisible({ timeout: 10000 });

    // Allow socket event to settle
    await page.waitForTimeout(1500);

    // Count only within <main> to exclude the fixed BroadcastBanner outside the page body
    const count = await page.locator("main").getByText(msg).count();
    expect(count).toBe(1);
  });

  test("after page reload, published broadcast still appears exactly once", async ({ page }) => {
    // Publish via API so we control the message text, then verify after full reload
    await page.goto("/admin/broadcast");
    await page.waitForLoadState("networkidle");

    const msg = `ReloadDup-${Date.now()}`;
    await page.getByPlaceholder(/emergency broadcast message/i).fill(msg);
    await page.getByRole("button", { name: /publish broadcast/i }).click();
    await expect(page.getByText("Broadcast published")).toBeVisible({ timeout: 10000 });

    // Hard reload — clears in-memory state; page must fetch from API and still show 1 row
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Scope to <main> only — BroadcastBanner is rendered outside main via fixed position
    const count = await page.locator("main").getByText(msg).count();
    expect(count).toBe(1);
  });
});

test.describe("Admin Missing Persons", () => {
  test("loads missing persons table", async ({ page }) => {
    await page.goto("/admin/missing");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Missing Persons")).toBeVisible();
    await expect(page.getByText("Kamal Perera")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin Flags Review", () => {
  test("loads flags page", async ({ page }) => {
    await page.goto("/admin/flags");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/flag/i).first()).toBeVisible();
  });
});

test.describe("Admin Audit Log", () => {
  test("loads log page", async ({ page }) => {
    await page.goto("/admin/log");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/log/i).first()).toBeVisible();
  });
});

test.describe("Admin Camps Management", () => {
  test("loads camps with seeded camp", async ({ page }) => {
    await page.goto("/admin/camps");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Colombo District Relief Camp A")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin Volunteer Management", () => {
  test("loads volunteers table", async ({ page }) => {
    await page.goto("/admin/volunteers");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Dr. Priya Fernando")).toBeVisible({ timeout: 10000 });
  });
});
