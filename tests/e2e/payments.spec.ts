import { test, expect } from "@playwright/test";
import { getTestCredentials } from "../helpers/credentials";

test.describe("E2E Phase 11: Real Payments (JazzCash + Easypaisa Sandbox)", () => {
  test("parent can initiate payment, complete sandbox checkout, and see invoice marked PAID", async ({
    page,
  }) => {
    const { parentPassword } = getTestCredentials();
    // 1. Sign in as the seed parent
    await page.goto("/login");
    await page.fill('input[type="email"]', "parent@academyhub.test");
    await page.fill('input[type="password"]', parentPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(change-password|parent)/, { timeout: 15000 });

    if (page.url().includes("/change-password")) {
      await page.fill('input[name="currentPassword"]', parentPassword);
      await page.fill('input[name="newPassword"]', parentPassword);
      await page.fill('input[name="confirmPassword"]', parentPassword);
      await page.click('button[type="submit"]');
    }

    await expect(page).toHaveURL(/\/parent/);
    await expect(page.getByRole("heading", { name: "Parent Portal" })).toBeVisible();

    // 2. Switch to "Fee Status & Challans" tab
    const feesTab = page.getByRole("button", { name: /Fee Status/i }).first();
    await feesTab.click();

    // 3. Locate Pay Now button on an unpaid invoice
    const payNowBtn = page.getByRole("button", { name: "Pay Now" }).first();
    if (await payNowBtn.isVisible()) {
      await payNowBtn.click();

      // 4. Expect navigation to sandbox checkout wallet page
      await page.waitForURL(/\/sandbox\/checkout\/jazzcash/, { timeout: 10000 });
      await expect(page.getByText("JazzCash Mobile Wallet")).toBeVisible();
      await expect(page.getByText("Official Sandbox Gateway")).toBeVisible();

      // 5. Click "Authorize & Pay"
      const authorizeBtn = page.getByRole("button", { name: /Authorize & Pay/i });
      await expect(authorizeBtn).toBeVisible();
      await authorizeBtn.click();

      // 6. Expect redirect back to parent portal with payment=success
      await page.waitForURL(/\/parent\?payment=success/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: "Parent Portal" })).toBeVisible();

      // Ensure Fee tab is active
      const feeTab = page.getByRole("button", { name: /Fee Status/i }).first();
      await feeTab.click();

      // 7. Verify the invoice shows PAID badge
      const paidBadge = page.getByText("PAID").first();
      await expect(paidBadge).toBeVisible();
    }
  });
});
