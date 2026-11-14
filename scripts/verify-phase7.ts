import { db } from "../src/lib/db";
import { getParentDashboardData, getParentChildData } from "../src/lib/parent";
import { AuthorizationError } from "../src/lib/permissions";
import { Role, TestStatus, AttendanceStatus } from "@prisma/client";

async function verifyPhase7() {
  console.log("==================================================");
  console.log("AcademyHub — Phase 7 Verification Suite");
  console.log("==================================================\n");

  // Step 1: Find seeded Parent
  const parent = await db.user.findUnique({
    where: { email: "parent@academyhub.test" },
    include: { children: true },
  });

  if (!parent) {
    throw new Error("Seeded parent parent@academyhub.test not found. Run seed script.");
  }

  console.log(`[Step 1] Seeded Parent: ${parent.name} (${parent.email}, ID: ${parent.id})`);
  console.log(`Linked Children in DB: ${parent.children.length}`);
  parent.children.forEach((c) => console.log(`  • ${c.name} (${c.admissionNo})`));

  const child = parent.children[0];
  if (!child) {
    throw new Error("Seeded parent has no linked children.");
  }

  // Ensure child has a published test result for verification
  let batch = await db.batch.findFirst({
    where: { enrollments: { some: { studentId: child.id, status: "ACTIVE" } } },
    include: { class: true },
  });

  if (batch) {
    // Check or create a test and published result
    let test = await db.test.findFirst({
      where: { batchId: batch.id, status: TestStatus.PUBLISHED },
    });

    if (!test) {
      test = await db.test.create({
        data: {
          batchId: batch.id,
          subject: "Mathematics",
          title: "Chapter 1 Assessment",
          totalMarks: 100,
          date: new Date("2026-11-10T00:00:00.000Z"),
          status: TestStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
    }

    await db.testResult.upsert({
      where: {
        testId_studentId: {
          testId: test.id,
          studentId: child.id,
        },
      },
      create: {
        testId: test.id,
        studentId: child.id,
        obtainedMarks: 94,
        remarks: "Superb algebraic formulation and accuracy.",
      },
      update: {
        obtainedMarks: 94,
        remarks: "Superb algebraic formulation and accuracy.",
      },
    });
  }

  // Step 2: Load Parent Dashboard Data
  console.log("\n[Step 2] Loading Parent Dashboard Data...");
  const dashboard = await getParentDashboardData(parent.id, Role.PARENT);

  console.log(`✓ Welcome message: ${dashboard.parent.name} (${dashboard.parent.email})`);
  console.log(`✓ Children returned: ${dashboard.children.length}`);

  if (dashboard.children.length !== parent.children.length) {
    throw new Error(`Expected ${parent.children.length} children, got ${dashboard.children.length}`);
  }

  const childSummary = dashboard.children[0];
  console.log(`\n[Step 3] Verifying Child Details for ${childSummary.student.name}:`);
  console.log(`  • Attendance: ${childSummary.attendance.percentage}% (${childSummary.attendance.presentCount} present, ${childSummary.attendance.absentCount} absent, ${childSummary.attendance.totalSessions} total sessions)`);
  console.log(`  • Fee Invoices: ${childSummary.fees.invoices.length} invoices, Outstanding Dues: PKR ${childSummary.fees.totalOutstandingMinor / 100}`);
  if (childSummary.fees.invoices.length > 0) {
    const inv = childSummary.fees.invoices[0];
    console.log(`    - Month: ${inv.month}, Total: PKR ${inv.totalMinor / 100}, Paid: PKR ${inv.paidMinor / 100}, Remaining: PKR ${inv.remainingMinor / 100}, Status: ${inv.status}`);
  }
  console.log(`  • Published Results: ${childSummary.results.length} tests`);
  if (childSummary.results.length > 0) {
    const res = childSummary.results[0];
    console.log(`    - Test: "${res.title}" (${res.subject}): ${res.obtainedMarks}/${res.totalMarks} (${res.percentage}%, Grade ${res.grade}, Rank ${res.classPosition})`);
  }
  console.log(`  • Timetable Slots: ${childSummary.enrollments.reduce((sum, e) => sum + e.timetableSlots.length, 0)} scheduled slots`);
  console.log(`  • Messages / Notices Archive: ${dashboard.messages.length} notices`);
  if (dashboard.messages.length > 0) {
    console.log(`    - Latest Notice [${dashboard.messages[0].trigger}]: "${dashboard.messages[0].message}"`);
  }

  // Step 4: Test Invariant 5 (Strict Parent Isolation)
  console.log("\n[Step 4] Testing Invariant 5: Strict Child Data Isolation...");

  // Create another parent user
  const otherParent = await db.user.create({
    data: {
      email: `other.parent.${Date.now()}@test.local`,
      passwordHash: "hash",
      name: "Other Parent",
      role: Role.PARENT,
      phone: "03009999999",
    },
  });

  // Create an unlinked student belonging to the other parent
  const otherStudent = await db.student.create({
    data: {
      admissionNo: `TEST-OTHER-${Date.now()}`,
      name: "Other Parent Child",
      guardianName: "Other Guardian",
      guardianPhone: "03009999999",
      guardianUserId: otherParent.id,
    },
  });

  console.log(`Created Other Student: ${otherStudent.name} (ID: ${otherStudent.id}, Guardian: ${otherParent.email})`);

  // Parent attempts to access otherStudent via service layer
  let blockedService = false;
  try {
    await getParentChildData(parent.id, otherStudent.id, Role.PARENT);
  } catch (err: any) {
    if (err instanceof AuthorizationError && err.statusCode === 403) {
      blockedService = true;
      console.log(`✓ Service layer access denied with 403: "${err.message}"`);
    } else {
      throw err;
    }
  }

  if (!blockedService) {
    throw new Error("Security breach! Parent was able to access an unlinked student!");
  }
  console.log("✓ PASS: Invariant 5 enforced at service layer (cross-child access throws 403).");

  // Cleanup other student and other parent
  await db.student.delete({ where: { id: otherStudent.id } });
  await db.user.delete({ where: { id: otherParent.id } });

  console.log("\n==================================================");
  console.log("ALL PHASE 7 VERIFICATION REQUIREMENTS PASSED!");
  console.log("==================================================");
}

verifyPhase7()
  .then(async () => {
    await db.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Verification failed:", e);
    await db.$disconnect();
    process.exit(1);
  });
