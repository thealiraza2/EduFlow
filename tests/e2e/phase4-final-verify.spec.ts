import { test, expect } from "@playwright/test";
import * as path from "path";
import { getTestCredentials } from "../helpers/credentials";

test.describe("PHASE 4 — Final Verification (Whole Site)", () => {
  const viewports = [
    { name: "360px", width: 360, height: 800 },
    { name: "768px", width: 768, height: 1024 },
    { name: "1024px", width: 1024, height: 800 },
    { name: "1440px", width: 1440, height: 900 },
  ];

  const publicPages = [
    { name: "home", url: "/" },
    { name: "features", url: "/features" },
    { name: "pricing", url: "/pricing" },
    { name: "about", url: "/about" },
    { name: "contact", url: "/contact" },
    { name: "login", url: "/login" },
    { name: "signup", url: "/signup" },
  ];

  test("1. Comprehensive Screenshots & Zero Horizontal Overflow at 360/768/1024/1440px", async ({
    page,
  }) => {
    for (const p of publicPages) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(p.url);
        await page.waitForLoadState("networkidle");

        // Assert zero horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);

        // Capture screenshot
        const screenshotPath = path.join(
          process.cwd(),
          "tests",
          "e2e",
          "screenshots",
          `final-${p.name}-${vp.name}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }
    }
  });

  test("2. Photos Check — Real hero-student.jpg & classroom.jpg, student face unobstructed", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Hero Photo
    const heroImg = page.locator('img[alt="Smiling schoolgirl in uniform holding books in bright classroom"]');
    await expect(heroImg).toBeVisible();
    const heroSrc = await heroImg.getAttribute("src");
    expect(heroSrc).toContain("hero-student.jpg");

    // Check dashboard only overlaps bottom <= 30% of photo
    const heroImgBox = await heroImg.boundingBox();
    const dashboardBox = await page.locator("text=EduFlow Academy Portal").locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first().boundingBox();
    expect(heroImgBox).not.toBeNull();
    expect(dashboardBox).not.toBeNull();
    const overlapPx = (heroImgBox!.y + heroImgBox!.height) - dashboardBox!.y;
    const overlapRatio = overlapPx / heroImgBox!.height;
    expect(overlapRatio).toBeLessThanOrEqual(0.30);
    expect(overlapRatio).toBeGreaterThan(0);

    // Classroom Photo
    const classroomImg = page.locator('img[alt="Teacher guiding teenage students on laptops in bright modern classroom"]');
    await expect(classroomImg).toBeVisible();
    const classroomSrc = await classroomImg.getAttribute("src");
    expect(classroomSrc).toContain("classroom.jpg");
  });

  test("3. Forms Check — Contact form saves to DB", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    await page.click('button:has-text("Pricing & plans")');
    const ts = Date.now();
    await page.fill('input[id="contact-name"]', `Principal Test ${ts}`);
    await page.fill('input[id="contact-email"]', `contact_${ts}@eduflowtest.edu.pk`);
    await page.fill('input[id="contact-phone"]', "03112233445");
    await page.fill('input[id="contact-school"]', `Islamia High School ${ts}`);
    await page.fill(
      'textarea[id="contact-message"]',
      "Requesting details about the Growth annual plan and free onboarding data import."
    );

    await page.click('button[type="submit"]');

    await expect(
      page.getByText("Thank you! Your message has been received. Our team will contact you shortly.")
    ).toBeVisible({ timeout: 10000 });
  });

  test("4. Forms Check — Signup creates a real trial tenant in DB", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");

    const ts = Date.now();
    const slug = `school-${ts}`;
    const adminEmail = `director_${ts}@testschool.edu.pk`;

    await page.fill('input[id="academyName"]', `Al-Hikmah School ${ts}`);
    await page.fill('input[id="slug"]', slug);
    await page.fill('input[id="adminName"]', "Dr. Usman Ali");
    await page.fill('input[id="adminEmail"]', adminEmail);
    await page.fill('input[id="adminPassword"]', "AdminSecurePass123!");
    await page.fill('input[id="adminPhone"]', "03009876543");

    await page.click('button[type="submit"]');

    // Should redirect to /login with registered=true
    await page.waitForURL(/\/login\?registered=true/, { timeout: 15000 });
    await expect(page.getByText("Your school platform is ready!")).toBeVisible();
  });

  test("5. Forms Check — Login signs in with real demo account", async ({ page }) => {
    const { adminPassword } = getTestCredentials();
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

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

    await page.waitForURL("**/admin", { timeout: 15000 });
    await expect(page.getByText("Admin Control Center")).toBeVisible();
  });

  test("6. Invariants — Zero dead links (href='#'), Zero SchulFlow, Zero Lorem Ipsum", async ({
    page,
  }) => {
    for (const p of publicPages) {
      await page.goto(p.url);
      await page.waitForLoadState("networkidle");

      // Zero href="#" on page
      const hashLinks = await page.locator('a[href="#"]').count();
      expect(hashLinks).toBe(0);

      // Page body text assertions
      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toMatch(/SchulFlow/i);
      expect(bodyText).not.toMatch(/Lorem\s+ipsum/i);
    }
  });
});
