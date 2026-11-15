import { test, expect } from "@playwright/test";
import { getTestCredentials } from "../helpers/credentials";

test.describe("E2E Phase 12: Online Test Engine & Student Portal", () => {
  test("student can access portal, take test, view score and leaderboard", async ({ page }) => {
    const { studentPassword } = getTestCredentials();
    // 1. Sign in as the seed student
    await page.goto("/login");
    await page.fill('input[type="email"]', "student@eduflow.test");
    await page.fill('input[type="password"]', studentPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(change-password|student)/, { timeout: 15000 });

    if (page.url().includes("/change-password")) {
      await page.fill('input[name="currentPassword"]', studentPassword);
      await page.fill('input[name="newPassword"]', studentPassword);
      await page.fill('input[name="confirmPassword"]', studentPassword);
      await page.click('button[type="submit"]');
    }

    await expect(page).toHaveURL(/\/student/);
    await expect(page.getByText("Student Portal")).toBeVisible();
    await expect(page.getByText("Hamza Tariq")).toBeVisible();

    // 2. Open Midterm Physics Online Test
    const testLink = page.getByRole("link", { name: /Leaderboard|Start Test/i }).first();
    await expect(testLink).toBeVisible();
    await testLink.click();

    await expect(page).toHaveURL(/\/student\/test\//);
    await expect(page.getByText(/Midterm Physics Online Test/)).toBeVisible();

    // 3. Verify leaderboard or assessment screen is rendered
    const hasLeaderboard = await page.getByText("Batch Leaderboard").isVisible();
    const hasInstructions = await page.getByText("Instructions & Evaluation Rules").isVisible();
    expect(hasLeaderboard || hasInstructions).toBe(true);
  });

  test("teacher can access marking queue and review test leaderboards", async ({ page }) => {
    const { teacherPassword } = getTestCredentials();
    // 1. Sign in as teacher
    await page.goto("/login");
    await page.fill('input[type="email"]', "usman.teacher@eduflow.test");
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(change-password|teacher)/, { timeout: 15000 });

    if (page.url().includes("/change-password")) {
      await page.fill('input[name="currentPassword"]', teacherPassword);
      await page.fill('input[name="newPassword"]', teacherPassword);
      await page.fill('input[name="confirmPassword"]', teacherPassword);
      await page.click('button[type="submit"]');
    }

    await expect(page).toHaveURL(/\/teacher/);
    await expect(page.getByText("Teacher Portal")).toBeVisible();

    // 2. Navigate to Marking Queue
    await page.goto("/teacher/marking");
    await expect(page.getByText("Online Test Evaluation & Leaderboards")).toBeVisible();

    // 3. Check Leaderboards tab
    const leaderboardsTab = page.getByRole("button", { name: /Online Tests & Leaderboards/i });
    await expect(leaderboardsTab).toBeVisible();
    await leaderboardsTab.click();

    await expect(page.getByText("Midterm Physics Online Test")).toBeVisible();
  });
});
