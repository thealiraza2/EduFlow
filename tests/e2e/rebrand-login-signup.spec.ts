import { test, expect } from "@playwright/test";
import { getTestCredentials } from "../helpers/credentials";
import * as path from "path";

test.describe("Phase 2 — Rebrand Login + Signup to EduFlow", () => {
  test("1. Login Page (/login) — Brand, Split Screen, Solid Yellow Button & Dashboard Mockup", async ({
    page,
  }) => {
    // Desktop Viewport (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Title & Header Branding
    await expect(page).toHaveTitle(/EduFlow/i);
    await expect(page.locator('img[alt="EduFlow Logo"]').first()).toBeVisible();
    await expect(page.getByText("EduFlow Secure Portal")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

    // Check Button Color: Solid Yellow (#F5B800)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText("Sign In");
    const btnColor = await submitBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // rgb(245, 184, 0) corresponds to #F5B800
    expect(btnColor).toBe("rgb(245, 184, 0)");

    // Split Screen Right Panel (Solid Yellow)
    await expect(page.getByText("Complete School Management, Simplified.")).toBeVisible();
    await expect(page.getByText("14-day free trial", { exact: true })).toBeVisible();
    await expect(page.getByText("No credit card required")).toBeVisible();
    await expect(page.getByText("Free onboarding & data import")).toBeVisible();

    // Real JSX Dashboard Mockup in right panel
    await expect(page.getByText("EduFlow Academy Portal")).toBeVisible();
    await expect(page.getByText("Live Demo Preview")).toBeVisible();

    // Invariant: NO testimonial cards or fake people quotes
    await expect(page.getByText("Testimonial")).not.toBeVisible();
    await expect(page.getByText("What our customers say")).not.toBeVisible();

    // Capture 1440px screenshot
    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/screenshots/login-1440px.png"),
      fullPage: true,
    });

    // Mobile Viewport (360px)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("EduFlow Secure Portal")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Capture 360px screenshot
    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/screenshots/login-360px.png"),
      fullPage: true,
    });
  });

  test("2. Signup Page (/signup) — Brand, Subdomain .eduflow.app, Button, Footer Links", async ({
    page,
  }) => {
    // Desktop Viewport (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");

    // Title & Header Branding
    await expect(page).toHaveTitle(/EduFlow/i);
    await expect(page.locator('img[alt="EduFlow Logo"]')).toBeVisible();
    await expect(page.getByText("Create Your School Platform")).toBeVisible();

    // Subdomain Suffix .eduflow.app
    await expect(page.getByText(".eduflow.app")).toBeVisible();

    // Check Button Color: Solid Yellow (#F5B800)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText("Start 14-Day Free PRO Trial");
    const btnColor = await submitBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(btnColor).toBe("rgb(245, 184, 0)");

    // Footer Links
    await expect(page.getByRole("link", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Terms of Service" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

    // Capture 1440px screenshot
    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/screenshots/signup-1440px.png"),
      fullPage: true,
    });

    // Mobile Viewport (360px)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(".eduflow.app")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Capture 360px screenshot
    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/screenshots/signup-360px.png"),
      fullPage: true,
    });
  });

  test("3. Real Auth Verification — Sign in with demo account works", async ({ page }) => {
    const { adminPassword } = getTestCredentials();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Sign in with admin demo account
    await page.fill('input[name="email"]', "admin@academyhub.test");
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(change-password|admin)/, { timeout: 15000 });

    if (page.url().includes("/change-password")) {
      await page.fill('input[name="currentPassword"]', adminPassword);
      await page.fill('input[name="newPassword"]', adminPassword);
      await page.fill('input[name="confirmPassword"]', adminPassword);
      await page.click('button[type="submit"]');
    }

    // Should redirect to /admin and display dashboard
    await page.waitForURL("**/admin", { timeout: 15000 });
    await expect(page.getByText("Admin Control Center")).toBeVisible();
  });

  test("4. Public Pages Zero 'AcademyHub' Brand Invariant", async ({ page }) => {
    const publicUrls = ["/", "/login", "/signup", "/privacy", "/terms"];

    for (const url of publicUrls) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // Verify page title does not contain AcademyHub
      const title = await page.title();
      expect(title).not.toMatch(/AcademyHub/i);

      // Verify visible text does not contain AcademyHub
      const bodyText = await page.locator("body").innerText();
      // Allow nothing that says AcademyHub on public facing pages
      const matches = bodyText.match(/AcademyHub/i);
      expect(matches).toBeNull();
    }
  });
});
