import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Marketing Landing Page — Phase 1: Navbar, Hero, Trust Strip", () => {
  test.beforeAll(async () => {
    const screenshotDir = path.join(process.cwd(), "tests", "e2e", "screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test("Mobile Viewport (360px): Hero stacks, zero horizontal overflow, mobile nav works", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");

    // 1. Check title & headline
    await expect(page).toHaveTitle(/AcademyHub/);
    const h1 = page.locator("h1");
    await expect(h1).toContainText("Poora");
    await expect(h1).toContainText("jagah.");

    // 2. Check no horizontal scrollbar / overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 3. Verify hero stacks vertically: headline is visually above the photo/dashboard
    const h1Box = await h1.boundingBox();
    const mockBox = await page.locator("text=Iqbal Science Academy").boundingBox();
    expect(h1Box).not.toBeNull();
    expect(mockBox).not.toBeNull();
    if (h1Box && mockBox) {
      expect(mockBox.y).toBeGreaterThan(h1Box.y);
    }

    // 4. Verify Mobile Hamburger Nav
    const hamburgerBtn = page.locator('button[aria-label*="navigation menu"]');
    await expect(hamburgerBtn).toBeVisible();

    // Open hamburger menu
    await hamburgerBtn.click();
    const navLink = page.locator('nav[aria-label="Mobile Navigation"] >> text=Features');
    await expect(navLink).toBeVisible();

    // Tap link in mobile nav -> menu closes automatically
    await navLink.click();
    await expect(page.locator('nav[aria-label="Mobile Navigation"]')).not.toBeVisible();

    // 5. Verify CTA is clickable
    const trialBtn = page.locator('a:has-text("Start 14-Day Free Trial")').first();
    await expect(trialBtn).toBeVisible();
    await trialBtn.click();

    // Wait 2s for fee flip animation
    await page.waitForTimeout(2000);

    // 6. Screenshot 360px
    await page.screenshot({
      path: "tests/e2e/screenshots/phase1-360px.png",
      fullPage: false,
    });
  });

  test("Tablet Viewport (768px): Responsive layout & zero horizontal scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify CTAs
    const trialBtn = page.locator('a:has-text("Start 14-Day Free Trial")').first();
    await expect(trialBtn).toBeVisible();

    // Screenshot 768px
    await page.screenshot({
      path: "tests/e2e/screenshots/phase1-768px.png",
      fullPage: false,
    });
  });

  test("Desktop Viewport (1440px): 2-column split hero, desktop nav, trust strip, floating dashboard", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // 1. Verify Desktop Navigation
    await expect(page.locator('nav[aria-label="Main Navigation"]')).toBeVisible();
    await expect(page.locator('nav[aria-label="Main Navigation"] >> text=Features')).toBeVisible();
    await expect(page.locator('nav[aria-label="Main Navigation"] >> text=Pricing')).toBeVisible();
    await expect(page.locator('nav[aria-label="Main Navigation"] >> text=How it works')).toBeVisible();
    await expect(page.locator('nav[aria-label="Main Navigation"] >> text=FAQ')).toBeVisible();
    await expect(page.locator('nav[aria-label="Main Navigation"] >> text=Contact')).toBeVisible();
    await expect(page.locator('header >> text=Log in')).toBeVisible();

    // 2. Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 3. Verify 2-Column Split: H1 on left, photo/mock on right
    const h1Box = await page.locator("h1").boundingBox();
    const mockBox = await page.locator("text=Iqbal Science Academy").boundingBox();
    expect(h1Box).not.toBeNull();
    expect(mockBox).not.toBeNull();
    if (h1Box && mockBox) {
      expect(mockBox.x).toBeGreaterThan(h1Box.x);
    }

    // 4. Verify Floating Dashboard Content
    await expect(page.locator("text=Today's Attendance").or(page.locator("text=Daily Attendance"))).toBeVisible();
    await expect(page.getByText("Ahmed Raza", { exact: true })).toBeVisible();
    await expect(page.getByText("Bilal Tariq", { exact: true })).toBeVisible();
    await expect(page.locator("text=Present").first()).toBeVisible();
    await expect(page.locator("text=Absent")).toBeVisible();

    // Fee payment status check (verifying -> PAID flip)
    await page.waitForTimeout(2200);
    await expect(page.getByText("PAID", { exact: true })).toBeVisible();

    // 5. Verify Trust Strip 3 Honest Items
    await expect(page.locator("text=288 Punjab board pairing schemes built in")).toBeVisible();
    await expect(page.locator("text=QR attendance in 10-minute secure tokens")).toBeVisible();
    await expect(page.locator("text=JazzCash & Easypaisa fee collection")).toBeVisible();

    // 6. Screenshot 1440px
    await page.screenshot({
      path: "tests/e2e/screenshots/phase1-1440px.png",
      fullPage: false,
    });
  });
});
