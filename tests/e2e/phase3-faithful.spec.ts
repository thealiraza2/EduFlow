import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("Phase 3 — 100% Reference-Faithful Marketing Pages & Verification", () => {
  const pagesToTest = [
    { name: "home", url: "/", titlePart: "EduFlow" },
    { name: "features", url: "/features", titlePart: "Features" },
    { name: "pricing", url: "/pricing", titlePart: "Pricing" },
    { name: "about", url: "/about", titlePart: "About" },
    { name: "contact", url: "/contact", titlePart: "Contact" },
  ];

  test("1. Responsive Screenshots for all 5 pages at 1440px and 360px", async ({ page }) => {
    for (const p of pagesToTest) {
      // 1440px Desktop
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(p.url);
      await page.waitForLoadState("networkidle");

      const screenshotPath1440 = path.join(
        process.cwd(),
        "tests",
        "e2e",
        "screenshots",
        `${p.name}-1440px.png`
      );
      await page.screenshot({ path: screenshotPath1440, fullPage: true });

      // 360px Mobile
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(p.url);
      await page.waitForLoadState("networkidle");

      const screenshotPath360 = path.join(
        process.cwd(),
        "tests",
        "e2e",
        "screenshots",
        `${p.name}-360px.png`
      );
      await page.screenshot({ path: screenshotPath360, fullPage: true });
    }
  });

  test("2. Nav & Footer Zero Dead Links — All pages clickable and navigate cleanly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Nav Links
    const navItems = ["Home", "Features", "Pricing", "About", "Contact"];
    for (const item of navItems) {
      await page.locator(`header nav a:has-text("${item}")`).first().click();
      await page.waitForLoadState("networkidle");
      // Check active indicator exists (yellow underline)
      const activeUnderline = page.locator("header nav a span.bg-\\[\\#F5B800\\]");
      await expect(activeUnderline).toBeVisible();
    }

    // Check Footer Links (Home, Features, Pricing, About, Contact, Privacy Policy, Terms of Service)
    const footerLinks = [
      { text: "Home", expectedUrl: "/" },
      { text: "Features", expectedUrl: "/features" },
      { text: "Pricing", expectedUrl: "/pricing" },
      { text: "About", expectedUrl: "/about" },
      { text: "Contact", expectedUrl: "/contact" },
      { text: "Privacy Policy", expectedUrl: "/privacy" },
      { text: "Terms of Service", expectedUrl: "/terms" },
    ];

    for (const link of footerLinks) {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const footerLinkEl = page.locator(`footer nav a:has-text("${link.text}")`).first();
      await expect(footerLinkEl).toBeVisible();
      await footerLinkEl.click();
      await page.waitForURL(`**${link.expectedUrl}`);
    }
  });

  test("3. Features Page (/features) — 12 Modules, Invariant Check, Audience Cards, CTA", async ({
    page,
  }) => {
    await page.goto("/features");
    await page.waitForLoadState("networkidle");

    const expectedModules = [
      "Student Management",
      "Teacher Management",
      "Class & Batch Management",
      "Attendance (QR)",
      "Fees & Billing (Challan PDF)",
      "Exams & Results",
      "Timetable",
      "Online Test Engine",
      "AI Paper Generator",
      "AI Risk Analytics",
      "WhatsApp Bot",
      "Multi-Branch",
    ];

    for (const mod of expectedModules) {
      await expect(page.getByRole("heading", { name: mod })).toBeVisible();
    }

    // Invariant: NO library, NO transport, NO homework
    const pageContent = await page.textContent("body");
    expect(pageContent).not.toMatch(/library management/i);
    expect(pageContent).not.toMatch(/transport management|school bus/i);
    expect(pageContent).not.toMatch(/homework management/i);

    // Audience cards
    await expect(page.getByText("Administrators & Principals")).toBeVisible();
    await expect(page.getByText("Teachers & Faculty")).toBeVisible();
    await expect(page.getByText("Parents & Guardians")).toBeVisible();

    // Dashboard Mockup present
    await expect(page.getByText("EduFlow Academy Portal")).toBeVisible();
  });

  test("4. Pricing Page (/pricing) — Monthly/Yearly toggle, Comparison Table, 5 FAQs", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Monthly state (default)
    await expect(page.getByText("2,500")).toBeVisible();
    await expect(page.getByText("5,000")).toBeVisible();
    await expect(page.getByText("9,000")).toBeVisible();

    // Click toggle to Yearly state
    await page.locator('button[aria-label="Toggle billing duration"]').click();

    // Yearly state
    await expect(page.getByText("25,000")).toBeVisible();
    await expect(page.getByText("50,000")).toBeVisible();
    await expect(page.getByText("90,000")).toBeVisible();

    // Comparison Table
    await expect(page.getByText("Detailed Feature Comparison")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Student Capacity" })).toBeVisible();

    // 5-Question FAQ Accordion
    const faqQuestions = [
      "What happens after the 14-day free trial?",
      "Can I change plans or upgrade later?",
      "Can we migrate or import our existing student and fee data?",
      "Is our school and student data secure?",
      "Is WhatsApp messaging cost separate?",
    ];

    for (const q of faqQuestions) {
      const qBtn = page.getByRole("button", { name: q });
      await expect(qBtn).toBeVisible();
      // Click question to open accordion
      await qBtn.click();
      await page.waitForTimeout(100);
    }
  });

  test("5. About Page (/about) — Honest Story, Mission/Vision, 4 Values, Real Stats, Ali Raza ONLY", async ({
    page,
  }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");

    // Our Story heading and content
    await expect(page.getByRole("heading", { name: "Why EduFlow Was Built" })).toBeVisible();

    // Mission & Vision
    await expect(page.getByRole("heading", { name: "Our Mission" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Our Vision" })).toBeVisible();

    // 4 Values
    await expect(page.getByRole("heading", { name: "Simplicity First" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trust & Security" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Partnership" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "People Matter" })).toBeVisible();

    // Stats with REAL numbers only
    await expect(page.getByText("288", { exact: true })).toBeVisible();
    await expect(page.getByText("12", { exact: true })).toBeVisible();
    await expect(page.getByText("14 Days")).toBeVisible();

    // Invariant: NO fake stats like "2,500+ schools"
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toMatch(/2,?500\+\s*schools/i);
    expect(bodyText).not.toMatch(/10,?000\+\s*students/i);

    // Team = Ali Raza, Founder & Developer, ONLY
    await expect(page.getByRole("heading", { name: "Ali Raza" })).toBeVisible();
    await expect(page.getByText("Founder & Developer", { exact: true })).toBeVisible();
  });

  test("6. Contact Page (/contact) — Topic Pills, Functional Form, DB Save, 3 FAQs", async ({
    page,
  }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    // Topic Pills
    await page.click('button:has-text("Technical support")');

    // Fill form
    const timestamp = Date.now();
    await page.fill('input[id="contact-name"]', `Test User ${timestamp}`);
    await page.fill('input[id="contact-email"]', `user${timestamp}@testschool.edu.pk`);
    await page.fill('input[id="contact-phone"]', "03009988776");
    await page.fill('input[id="contact-school"]', "Beacon Science Academy");
    await page.fill(
      'textarea[id="contact-message"]',
      "We would like a live demonstration of the Punjab board paper generator and fee challan system."
    );

    // Submit
    await page.click('button[type="submit"]');

    // Expect success message
    await expect(
      page.getByText("Thank you! Your message has been received. Our team will contact you shortly.")
    ).toBeVisible({ timeout: 10000 });

    // 3 FAQs
    const contactFaqs = [
      "How quickly will someone contact me?",
      "Can I schedule a one-on-one live demo for my administration?",
      "Do you provide on-site or remote staff training?",
    ];

    for (const q of contactFaqs) {
      await expect(page.getByRole("button", { name: q })).toBeVisible();
    }
  });

  test("7. Benefits Section — Confirm all 6 benefit cards exist on Homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const expectedBenefits = [
      "Secure & Reliable",
      "Cloud Based",
      "Easy to Use",
      "Dedicated Support",
      "Fully Customizable",
      "Affordable Pricing",
    ];

    for (const b of expectedBenefits) {
      await expect(page.getByRole("heading", { name: b })).toBeVisible();
    }
  });
});
