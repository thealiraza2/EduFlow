import { test, expect } from "@playwright/test";

test("admin can sign in and reaches /admin", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@academyhub.test");
  await page.fill('input[name="password"]', "Admin123!");
  await page.click('button[type="submit"]');

  await page.waitForURL("**/admin", { timeout: 15000 });
  await expect(page.getByText("Admin Control Center")).toBeVisible();
});

test("teacher can sign in and reaches /teacher", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "usman.teacher@academyhub.test");
  await page.fill('input[name="password"]', "Teacher123!");
  await page.click('button[type="submit"]');

  await page.waitForURL("**/teacher", { timeout: 15000 });
  await expect(page.getByText("Teacher Portal")).toBeVisible();
});

test("parent can sign in and reaches /parent", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill('input[name="email"]', "parent@academyhub.test");
  await page.fill('input[name="password"]', "Parent123!");
  await page.click('button[type="submit"]');

  await page.waitForURL("**/parent", { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Parent Portal" })).toBeVisible();
});
