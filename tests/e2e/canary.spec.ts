import { test, expect } from "@playwright/test";

test("health check API returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.status).toBe("ok");
});

test("login page renders successfully in headless chrome", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("EduFlow Secure Portal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
});
