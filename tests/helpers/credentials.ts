import fs from "fs";
import path from "path";

export function getTestCredentials() {
  let fileCredentials: Record<string, string> = {};
  try {
    const credsPath = path.join(process.cwd(), ".seed-passwords.json");
    if (fs.existsSync(credsPath)) {
      fileCredentials = JSON.parse(fs.readFileSync(credsPath, "utf8"));
    }
  } catch {
    // fallback if file doesn't exist
  }

  return {
    superadminPassword:
      process.env.SEED_SUPERADMIN_PASSWORD || fileCredentials.superadmin || "Seed_superadmin_123!",
    adminPassword:
      process.env.SEED_ADMIN_PASSWORD || fileCredentials.admin || "Seed_admin_123!",
    teacherPassword:
      process.env.SEED_TEACHER_PASSWORD || fileCredentials.teacher || "Seed_teacher_123!",
    parentPassword:
      process.env.SEED_PARENT_PASSWORD || fileCredentials.parent || "Seed_parent_123!",
    studentPassword:
      process.env.SEED_STUDENT_PASSWORD || fileCredentials.student || "Seed_student_123!",
  };
}
