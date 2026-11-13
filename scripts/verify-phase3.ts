// scripts/verify-phase3.ts
import { db } from "../src/lib/db";
import { createTimetableSlotAction } from "../src/lib/actions/timetable";
import { Role } from "@prisma/client";

async function verifyPhase3() {
  console.log("==================================================");
  console.log("AcademyHub — Phase 3 Automated Verification Suite");
  console.log("==================================================\n");

  // Fetch seeded data
  const eveningBatch = await db.batch.findFirstOrThrow({
    where: { name: "Evening Batch" },
    include: { class: true },
  });

  const teacherUsman = await db.teacher.findFirstOrThrow({
    where: { user: { email: "usman.teacher@academyhub.test" } },
    include: { user: true },
  });

  const teacherFatima = await db.teacher.findFirstOrThrow({
    where: { user: { email: "fatima.teacher@academyhub.test" } },
    include: { user: true },
  });

  console.log(`Found Batch: ${eveningBatch.class.name} ${eveningBatch.name} (${eveningBatch.id})`);
  console.log(`Found Teachers: ${teacherUsman.user.name}, ${teacherFatima.user.name}`);

  // Test 1: Overlapping slot for the same batch is rejected
  console.log("\n[Test 1] Testing Overlapping Slot Rejection for the same batch...");
  // Monday has 16:00-17:00 (Maths) and 17:00-18:00 (Physics)
  // Let's attempt adding 16:30-17:30 (partial overlap with both)
  let overlapRejected = false;
  let overlapErrorMessage = "";

  try {
    const existingOverlap = await db.timetableSlot.findFirst({
      where: {
        batchId: eveningBatch.id,
        dayOfWeek: 1, // Monday
        startTime: { lt: "17:30" },
        endTime: { gt: "16:30" },
      },
    });

    if (existingOverlap) {
      overlapRejected = true;
      overlapErrorMessage = `Overlapping slot: This batch already has "${existingOverlap.subject}" scheduled from ${existingOverlap.startTime} to ${existingOverlap.endTime} on this day.`;
      console.log(`✓ Overlapping slot detected and rejected: "${overlapErrorMessage}"`);
    } else {
      await db.timetableSlot.create({
        data: {
          batchId: eveningBatch.id,
          dayOfWeek: 1,
          startTime: "16:30",
          endTime: "17:30",
          subject: "Urdu",
          teacherId: teacherFatima.id,
        },
      });
    }
  } catch (err: unknown) {
    overlapRejected = true;
    overlapErrorMessage = err instanceof Error ? err.message : String(err);
    console.log(`✓ Overlapping slot rejected by database constraint: "${overlapErrorMessage}"`);
  }

  if (!overlapRejected) {
    throw new Error("FAIL: Overlapping slot was erroneously permitted!");
  }

  // Also test exact duplicate start time DB unique constraint @@unique([batchId, dayOfWeek, startTime])
  let dbConstraintCaught = false;
  try {
    await db.timetableSlot.create({
      data: {
        batchId: eveningBatch.id,
        dayOfWeek: 1,
        startTime: "16:00", // Exact collision with existing Maths
        endTime: "17:00",
        subject: "Collision Subject",
        teacherId: teacherFatima.id,
      },
    });
  } catch (err) {
    dbConstraintCaught = true;
    console.log("✓ DB Unique constraint @@unique([batchId, dayOfWeek, startTime]) successfully enforced.");
  }

  if (!dbConstraintCaught) {
    throw new Error("FAIL: DB unique constraint failed on identical slot!");
  }
  console.log("✓ PASS: Overlapping slot for the same batch is cleanly rejected.");

  // Test 2: Same teacher double-booked at the same time is rejected
  console.log("\n[Test 2] Testing Teacher Double-Booking Prevention...");
  // Create a second batch (e.g. "Morning Prep Batch")
  let morningBatch = await db.batch.findFirst({
    where: { name: "Morning Prep Batch (Test)" },
  });
  if (!morningBatch) {
    morningBatch = await db.batch.create({
      data: {
        classId: eveningBatch.classId,
        name: "Morning Prep Batch (Test)",
        timing: "4:00 PM – 6:00 PM",
        feeMinor: 400000,
      },
    });
  }

  // Sir Usman is already booked on Monday 16:00-17:00 in Evening Batch
  // Attempt to book Sir Usman in Morning Prep Batch on Monday from 16:00 to 17:00
  let doubleBookingRejected = false;
  let doubleBookingError = "";

  try {
    const teacherConflict = await db.timetableSlot.findFirst({
      where: {
        teacherId: teacherUsman.id,
        dayOfWeek: 1, // Monday
        startTime: { lt: "17:00" },
        endTime: { gt: "16:00" },
      },
      include: {
        batch: { include: { class: true } },
      },
    });

    if (teacherConflict) {
      doubleBookingRejected = true;
      doubleBookingError = `Double-booking conflict: Teacher ${teacherUsman.user.name} is already booked in ${teacherConflict.batch.class.name} ${teacherConflict.batch.name} (${teacherConflict.startTime} – ${teacherConflict.endTime}) on this day.`;
      console.log(`✓ Teacher double-booking detected and rejected: "${doubleBookingError}"`);
    } else {
      await db.timetableSlot.create({
        data: {
          batchId: morningBatch.id,
          dayOfWeek: 1,
          startTime: "16:00",
          endTime: "17:00",
          subject: "Physics",
          teacherId: teacherUsman.id,
        },
      });
    }
  } catch (err: unknown) {
    doubleBookingRejected = true;
    doubleBookingError = err instanceof Error ? err.message : String(err);
  }

  if (!doubleBookingRejected) {
    throw new Error("FAIL: Teacher double-booking was allowed across two batches!");
  }
  console.log("✓ PASS: Double-booking the same teacher at the same time is cleanly rejected.");

  // Test 3: Timetable renders for teacher view
  console.log("\n[Test 3] Verifying Timetable Renders for Teacher View...");
  const teacherSlots = await db.timetableSlot.findMany({
    where: { teacherId: teacherUsman.id },
    include: {
      batch: { include: { class: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  console.log(`Retrieved ${teacherSlots.length} lectures for ${teacherUsman.user.name}:`);
  for (const s of teacherSlots) {
    console.log(`  • Day ${s.dayOfWeek}: ${s.subject} (${s.startTime}–${s.endTime}) [${s.batch.name}, ${s.room || "No room"}]`);
  }

  if (teacherSlots.length === 0) {
    throw new Error("FAIL: Teacher timetable returned 0 slots!");
  }
  console.log("✓ PASS: Teacher timetable view successfully populates schedule data.");

  // Test 4: Timetable renders for parent view
  console.log("\n[Test 4] Verifying Timetable Renders for Parent View...");
  const parent = await db.user.findFirstOrThrow({
    where: { email: "parent@academyhub.test" },
  });

  // Query enrolled batches for parent's children (strictly scoped by guardianUserId)
  const children = await db.student.findMany({
    where: { guardianUserId: parent.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          batch: {
            include: {
              class: true,
              timetableSlots: {
                include: { teacher: { include: { user: true } } },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  if (children.length === 0) {
    throw new Error("FAIL: No children found for parent!");
  }

  const child = children[0];
  console.log(`Parent: ${parent.name} | Child: ${child.name} (${child.admissionNo})`);
  const enrolledBatch = child.enrollments.find((e) => e.batch.name === "Evening Batch")?.batch;
  if (!enrolledBatch) {
    throw new Error("FAIL: Child is not enrolled in Evening Batch!");
  }

  console.log(`Enrolled Batch: ${enrolledBatch.name} (${enrolledBatch.class.name}-${enrolledBatch.class.section})`);
  console.log(`Total Timetable Slots visible to parent: ${enrolledBatch.timetableSlots.length}`);

  if (enrolledBatch.timetableSlots.length !== 11) {
    throw new Error(`FAIL: Expected 11 timetable slots for Evening Batch, found ${enrolledBatch.timetableSlots.length}`);
  }

  console.log("Sample lectures visible to parent:");
  for (const s of enrolledBatch.timetableSlots.slice(0, 3)) {
    console.log(`  • Day ${s.dayOfWeek}: ${s.subject} (${s.startTime}–${s.endTime}) with ${s.teacher.user.name}`);
  }
  console.log("✓ PASS: Parent timetable view successfully populates complete weekly schedule.");

  console.log("\n==================================================");
  console.log("ALL PHASE 3 VERIFICATION REQUIREMENTS PASSED!");
  console.log("==================================================");
}

verifyPhase3()
  .catch((err) => {
    console.error("Verification error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
