import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";

test.describe("E2E Phase 10: Multi-Branch SaaS & Super Admin", () => {
  const ts = Date.now();
  const slug = `e2e-acad-${ts}`;
  const adminEmail = `e2e.admin.${ts}@test.local`;
  const academyName = `E2E Academy ${ts}`;

  test.afterAll(async () => {
    // Cleanup created academy and records
    const created = await db.academy.findUnique({ where: { slug } });
    if (created) {
      await db.academy.delete({ where: { id: created.id } }).catch(() => {});
    }
  });

  test("1. Public signup registers an academy and its admin user", async ({ page }) => {
    await page.goto("/signup");

    // Form should render with title and 14-day PRO trial badge
    await expect(page.locator("text=Create Your Academy Platform")).toBeVisible();
    await expect(page.getByText("14-Day Free PRO Trial • No Credit Card Required")).toBeVisible();

    // Fill form
    await page.fill("#academyName", academyName);
    await page.fill("#slug", slug);
    await page.fill("#adminName", "E2E Administrator");
    await page.fill("#adminEmail", adminEmail);
    await page.fill("#adminPassword", "Password123!");
    await page.fill("#adminPhone", "03001234567");

    // Live subdomain preview
    await expect(page.locator("text=.academyhub.app")).toBeVisible();
    await expect(page.locator("#slug")).toHaveValue(slug);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for successful redirect to login
    await page.waitForURL("**/login**", { timeout: 15000 });
  });

  test("2. Super Admin can view all academies and control tenant status", async ({ page }) => {
    // 1. Log in as superadmin
    await page.goto("/login");
    await page.fill('input[type="email"]', "superadmin@academyhub.test");
    await page.fill('input[type="password"]', "SuperAdmin123!");
    await page.click('button[type="submit"]');

    // 2. Redirects to /superadmin
    await page.waitForURL("**/superadmin", { timeout: 15000 });

    // 3. Control Center shows platform stats
    await expect(page.locator("h1")).toContainText(/Platform Administration/i);

    // 4. Verify tenant directory shows the newly signed-up academy
    await expect(page.locator(`text=${academyName}`)).toBeVisible();
    await expect(page.locator(`text=${slug}`)).toBeVisible();

    // 5. Verify 14-day trial / PRO badge
    const row = page.locator(`tr:has-text("${academyName}")`);
    await expect(row.locator("text=PRO")).toBeVisible();
    await expect(row.locator("text=ACTIVE")).toBeVisible();

    // 6. Test suspend toggle button
    const suspendBtn = row.locator('button:has-text("Suspend")');
    await suspendBtn.click();

    // Button should change to Activate and status to SUSPENDED
    await expect(row.locator("text=SUSPENDED")).toBeVisible();
    await expect(row.locator('button:has-text("Activate")')).toBeVisible();

    // 7. Test activate back
    const activateBtn = row.locator('button:has-text("Activate")');
    await activateBtn.click();
    await expect(row.locator("text=ACTIVE")).toBeVisible();
  });
});
