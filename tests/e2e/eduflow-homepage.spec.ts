import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("EduFlow Marketing Homepage — SchulFlow UI, English Only", () => {
  const viewports = [
    { name: "360px", width: 360, height: 800 },
    { name: "768px", width: 768, height: 1024 },
    { name: "1440px", width: 1440, height: 900 },
  ];

  test("1. Layout order and content verification", async ({ page }) => {
    await page.goto("/");

    // Section 1: Header
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.locator('img[alt="EduFlow Logo"]')).toBeVisible();
    await expect(header.getByText("School Management System")).toBeVisible();
    await expect(header.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Get Started Free" })).toBeVisible();

    // Section 2: Hero
    await expect(page.getByText("SMARTER SCHOOLS • BETTER TOMORROW")).toBeVisible();
    const heroH1 = page.locator("h1");
    await expect(heroH1).toContainText("Complete School Management System");
    await expect(
      page.getByText(
        "Streamline your school operations with an all-in-one platform. Manage students, teachers, classes, attendance, fees, exams and more — all in one place."
      )
    ).toBeVisible();

    // 3 checkmarks in Hero
    const heroSection = page.locator("section").first();
    await expect(heroSection.getByText("Easy to Use")).toBeVisible();
    await expect(heroSection.getByText("Secure & Reliable")).toBeVisible();
    await expect(heroSection.getByText("24/7 Support")).toBeVisible();

    // Hero CTAs
    const heroGetStarted = page.locator('section a[href="/signup"]').first();
    await expect(heroGetStarted).toBeVisible();
    const heroLearnMore = page.locator('section a[href="#features"]').first();
    await expect(heroLearnMore).toBeVisible();

    // Hero Student Image & Floating JSX Dashboard Mockup
    await expect(
      page.locator('img[alt="Smiling schoolgirl in uniform holding books in bright classroom"]')
    ).toBeVisible();
    await expect(page.getByText("EduFlow Academy Portal")).toBeVisible();
    await expect(page.getByText("Live Demo Preview")).toBeVisible();
    await expect(page.getByText("Total Students")).toBeVisible();
    await expect(page.getByText("3", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Teachers", { exact: true })).toBeVisible();
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Classes", { exact: true })).toBeVisible();
    await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pending Fees")).toBeVisible();
    await expect(page.getByText("PKR 0")).toBeVisible();

    // 3 lines of real recent activity
    await expect(page.getByText("Enrolled Hamza Tariq in 10th-A (Evening Batch)")).toBeVisible();
    await expect(page.getByText("Attendance registered for 10th-A Evening Batch")).toBeVisible();
    await expect(page.getByText("Midterm Physics Online Test graded and recorded")).toBeVisible();

    // Section 3: Six feature cards
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeVisible();
    await expect(featuresSection.getByText("CORE FEATURES")).toBeVisible();
    await expect(featuresSection.getByText("Everything You Need to Run Your School")).toBeVisible();

    const expectedFeatures = [
      {
        title: "Student Management",
        copy: "Complete student profiles with admissions, guardians and fee history.",
      },
      {
        title: "Teacher Management",
        copy: "Manage teachers, subjects, workload and performance in one place.",
      },
      {
        title: "Attendance",
        copy: "Mark attendance digitally with QR in seconds and keep automatic records.",
      },
      {
        title: "Fee Management",
        copy: "Automate invoices, challans, payments and reminders.",
      },
      {
        title: "Exams & Results",
        copy: "Create exams, evaluate and publish report cards instantly.",
      },
      {
        title: "Reports & Analytics",
        copy: "Turn school data into insights for better decisions.",
      },
    ];

    for (const feat of expectedFeatures) {
      await expect(featuresSection.getByText(feat.title, { exact: true })).toBeVisible();
      await expect(featuresSection.getByText(feat.copy)).toBeVisible();
    }

    // Section 4: Classroom (photo + text)
    await expect(
      page.locator(
        'img[alt="Teacher guiding teenage students on laptops in bright modern classroom"]'
      )
    ).toBeVisible();
    await expect(page.getByText("FOR A SMARTER SCHOOL")).toBeVisible();
    await expect(
      page.getByText("Simplify Daily Operations, Focus on What Matters")
    ).toBeVisible();
    await expect(
      page.getByText(
        "Our system helps academies and schools save time, reduce manual work and provide a better learning experience for students, parents and staff."
      )
    ).toBeVisible();
    await expect(page.getByText("Access from anywhere, anytime")).toBeVisible();
    await expect(page.getByText("Secure cloud-based platform")).toBeVisible();
    await expect(page.getByText("Customizable for schools of all sizes")).toBeVisible();

    // Section 5: Built for Modern Schools (6 benefit cards)
    await expect(page.getByText("WHY CHOOSE US")).toBeVisible();
    await expect(page.getByText("Built for Modern Schools")).toBeVisible();
    await expect(
      page.getByText("Everything you need to manage your school efficiently, safely and with confidence.")
    ).toBeVisible();

    const expectedBenefits = [
      "Secure & Reliable",
      "Cloud Based",
      "Easy to Use",
      "Dedicated Support",
      "Fully Customizable",
      "Affordable Pricing",
    ];
    for (const b of expectedBenefits) {
      await expect(page.getByRole("heading", { name: b, exact: true })).toBeVisible();
    }

    // Section 6: Testimonials ("Be our first success story")
    await expect(page.getByText("PARTNER WITH US")).toBeVisible();
    await expect(page.getByText("Transform Your School's Operations")).toBeVisible();
    await expect(
      page.getByText("Be our first success story — your academy's story could be here.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Start Free Trial" })).toBeVisible();

    // Section 7: CTA + Footer
    await expect(page.getByText("Get Started with EduFlow Today")).toBeVisible();
    await expect(page.getByText("Automate attendance, fees, and results with a 14-day free trial. Setup takes under 5 minutes.")).toBeVisible();

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText("© 2026 EduFlow. All rights reserved.")).toBeVisible();
  });

  test("2. Responsive Viewports (360px, 768px, 1440px) & Zero Horizontal Overflow", async ({
    page,
  }) => {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      // Verify zero horizontal scroll / overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow).toBe(false);

      // Verify hero elements stack nicely and remain visible
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText("SMARTER SCHOOLS • BETTER TOMORROW")).toBeVisible();
      await expect(page.getByText("EduFlow Academy Portal")).toBeVisible();

      // Capture screenshot
      const screenshotPath = path.join(
        process.cwd(),
        "tests",
        "e2e",
        "screenshots",
        `eduflow-home-${vp.name}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  });

  test("3. Button and Navigation Functional Verification", async ({ page }) => {
    await page.goto("/");

    // Click Login link in header -> lands on /login
    await page.locator('header a[href="/login"]').click();
    await expect(page).toHaveURL(/\/login/);

    // Go back and click Get Started Free -> lands on /signup
    await page.goto("/");
    await page.locator('header a[href="/signup"]').click();
    await expect(page).toHaveURL(/\/signup/);

    // Test Hero Learn More smooth scroll
    await page.goto("/");
    await page.locator('a[href="#features"]').click();
    await expect(page.locator("#features")).toBeVisible();

    // Test Testimonial CTA
    await page.locator('a:has-text("Start Free Trial")').click();
    await expect(page).toHaveURL(/\/signup/);

    // Test Footer links
    await page.goto("/");
    await page.locator('footer a[href="/privacy"]').click();
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();

    await page.goto("/");
    await page.locator('footer a[href="/terms"]').click();
    await expect(page).toHaveURL(/\/terms/);
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
  });
});
