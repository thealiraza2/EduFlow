import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting AcademyHub Phase 1 Database Seed...");

  // 1. Create the primary ADMIN account
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@academyhub.test" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Academy Director",
    },
    create: {
      email: "admin@academyhub.test",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Academy Director",
      phone: "03001234567",
    },
  });
  console.log(`✓ Admin user created/upserted: ${admin.email} (Role: ${admin.role})`);

  // 2. Create a test PARENT account for role-blocking verification
  const parentPasswordHash = await bcrypt.hash("Parent123!", 10);
  const parent = await prisma.user.upsert({
    where: { email: "parent@academyhub.test" },
    update: {
      passwordHash: parentPasswordHash,
      role: Role.PARENT,
      name: "Muhammad Tariq",
    },
    create: {
      email: "parent@academyhub.test",
      passwordHash: parentPasswordHash,
      role: Role.PARENT,
      name: "Muhammad Tariq",
      phone: "03219876543",
    },
  });
  console.log(`✓ Parent user created/upserted: ${parent.email} (Role: ${parent.role})`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
