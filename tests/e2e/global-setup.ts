import { db } from "@/lib/db";

export default async function globalSetup() {
  // Ensure seeded test accounts have mustChangePassword=false during automated E2E testing
  // so that the automated end-to-end regression suites can access role-specific dashboards
  try {
    await db.user.updateMany({
      where: {
        email: {
          in: [
            "superadmin@academyhub.test",
            "admin@academyhub.test",
            "usman.teacher@academyhub.test",
            "fatima.teacher@academyhub.test",
            "parent@academyhub.test",
            "student@academyhub.test",
          ],
        },
      },
      data: {
        mustChangePassword: false,
      },
    });
  } catch (err) {
    console.warn("[E2E GLOBAL SETUP WARNING]", err);
  }
}
