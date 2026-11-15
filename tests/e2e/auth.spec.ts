import { test, expect } from "@playwright/test";
import { getTestCredentials } from "../helpers/credentials";

test("Fix 1 & Fix 7: full change-password flow — login as seeded user -> redirected to /change-password -> API returns 403 -> change password -> lands on dashboard WITHOUT manual sign-out", async ({
  page,
}) => {
  const { adminPassword } = getTestCredentials();

  // 1. Visit /login and submit initial seeded credentials
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@eduflow.test");
  await page.fill('input[name="password"]', adminPassword);
  await page.click('button[type="submit"]');

  // 2. Verified redirected to /change-password because mustChangePassword is true initially
  await page.waitForURL("**/change-password", { timeout: 15000 });
  await expect(page.getByText("Change Your Password")).toBeVisible();

  // Fix 7 Verification: While mustChangePassword is true, API routes return JSON 403 instead of 302 redirect
  const apiCheck = await page.evaluate(async () => {
    const res = await fetch("/api/students");
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  });
  expect(apiCheck.status).toBe(403);
  expect(apiCheck.json?.error).toContain("Password change required");

  // 3. Complete change password form with new password
  await page.fill('input[name="currentPassword"]', adminPassword);
  await page.fill('input[name="newPassword"]', adminPassword);
  await page.fill('input[name="confirmPassword"]', adminPassword);
  await page.click('button[type="submit"]');

  // 4. Lands on /admin dashboard WITHOUT manual sign-out (session refreshed with mustChangePassword: false)
  await page.waitForURL("**/admin", { timeout: 15000 });
  await expect(page.getByText("Admin Control Center")).toBeVisible();
});

test("teacher can sign in and reaches /teacher", async ({ page }) => {
  const { teacherPassword } = getTestCredentials();
  await page.goto("/login");
  await page.fill('input[name="email"]', "usman.teacher@eduflow.test");
  await page.fill('input[name="password"]', teacherPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/(change-password|teacher)/, { timeout: 15000 });

  if (page.url().includes("/change-password")) {
    await page.fill('input[name="currentPassword"]', teacherPassword);
    await page.fill('input[name="newPassword"]', teacherPassword);
    await page.fill('input[name="confirmPassword"]', teacherPassword);
    await page.click('button[type="submit"]');
  }

  await page.waitForURL("**/teacher", { timeout: 15000 });
  await expect(page.getByText("Teacher Portal")).toBeVisible();
});

test("parent can sign in and reaches /parent", async ({ page }) => {
  const { parentPassword } = getTestCredentials();
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill('input[name="email"]', "parent@eduflow.test");
  await page.fill('input[name="password"]', parentPassword);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/(change-password|parent)/, { timeout: 15000 });

  if (page.url().includes("/change-password")) {
    await page.fill('input[name="currentPassword"]', parentPassword);
    await page.fill('input[name="newPassword"]', parentPassword);
    await page.fill('input[name="confirmPassword"]', parentPassword);
    await page.click('button[type="submit"]');
  }

  await page.waitForURL("**/parent", { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Parent Portal" })).toBeVisible();
});
