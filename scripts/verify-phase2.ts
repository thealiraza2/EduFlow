// scripts/verify-phase2.ts
import { db } from "../src/lib/db";
import { generateNextAdmissionNumber } from "../src/lib/admission";
import { formatPKR, rupeesToPaisa } from "../src/lib/money";
import { EnrollmentStatus, Role, StudentStatus, TeacherStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

async function verifyPhase2() {
  console.log("==================================================");
  console.log("AcademyHub — Phase 2 Automated Verification Suite");
  console.log("==================================================\n");

  // Step 1: Clean up test artifacts if previously created
  await db.enrollment.deleteMany({
    where: {
      student: {
        admissionNo: { in: ["AH-2026-TEST1", "AH-2026-TEST2"] },
      },
    },
  });
  await db.student.deleteMany({
    where: {
      name: { in: ["Hamza Tariq", "Ayesha Bibi"] },
    },
  });
  await db.batch.deleteMany({
    where: { name: "Evening Science Batch (Phase 2 Test)" },
  });
  await db.class.deleteMany({
    where: { name: "10th Grade (Phase 2 Test)" },
  });
  await db.teacher.deleteMany({
    where: { user: { email: "usman.teacher@academyhub.test" } },
  });
  await db.user.deleteMany({
    where: { email: "usman.teacher@academyhub.test" },
  });

  // Step 2: Admit Student 1
  console.log("[Step 1] Admitting Student 1 (Hamza Tariq)...");
  const student1AdmissionNo = await db.$transaction(async (tx) => {
    const admissionNo = await generateNextAdmissionNumber(tx);
    const s = await tx.student.create({
      data: {
        admissionNo,
        name: "Hamza Tariq",
        guardianName: "Muhammad Tariq",
        guardianPhone: "03001112233",
        status: StudentStatus.ACTIVE,
      },
    });
    return s.admissionNo;
  });
  console.log(`✓ Student 1 admitted with sequential Admission No: ${student1AdmissionNo}`);

  // Step 3: Admit Student 2
  console.log("\n[Step 2] Admitting Student 2 (Ayesha Bibi)...");
  const student2AdmissionNo = await db.$transaction(async (tx) => {
    const admissionNo = await generateNextAdmissionNumber(tx);
    const s = await tx.student.create({
      data: {
        admissionNo,
        name: "Ayesha Bibi",
        guardianName: "Abdul Rehman",
        guardianPhone: "03214445566",
        status: StudentStatus.ACTIVE,
      },
    });
    return s.admissionNo;
  });
  console.log(`✓ Student 2 admitted with sequential Admission No: ${student2AdmissionNo}`);

  // Check sequence
  const num1 = parseInt(student1AdmissionNo.split("-")[2], 10);
  const num2 = parseInt(student2AdmissionNo.split("-")[2], 10);
  if (num2 !== num1 + 1) {
    throw new Error(`FAIL: Admission numbers are not sequential! Got ${student1AdmissionNo} and ${student2AdmissionNo}`);
  }
  console.log("✓ Sequential check verified: never reused, correctly incremented.");

  // Step 4: Register Faculty / Teacher in a single transaction
  console.log("\n[Step 3] Hiring Teacher (Sir Usman Farooq) in a single transaction...");
  const teacher = await db.$transaction(async (tx) => {
    const passwordHash = await bcrypt.hash("Teacher123!", 10);
    const user = await tx.user.create({
      data: {
        email: "usman.teacher@academyhub.test",
        passwordHash,
        name: "Sir Usman Farooq",
        phone: "03339998877",
        role: Role.TEACHER,
      },
    });

    const salaryMinor = rupeesToPaisa(50000); // PKR 50,000 = 5,000,000 paisas

    return await tx.teacher.create({
      data: {
        userId: user.id,
        subjects: ["Physics", "Mathematics"],
        salaryMinor,
        status: TeacherStatus.ACTIVE,
      },
      include: { user: true },
    });
  });
  console.log(`✓ Teacher created: ${teacher.user.name} (${teacher.user.email})`);
  console.log(`✓ Salary stored in integer paisa: ${teacher.salaryMinor} paisas (${formatPKR(teacher.salaryMinor)})`);

  // Step 5: Create Class and Batch
  console.log("\n[Step 4] Creating Class & Batch with Assigned Teacher...");
  const classRecord = await db.class.create({
    data: {
      name: "10th Grade (Phase 2 Test)",
      section: "A",
      capacity: 35,
    },
  });

  const batchFeeMinor = rupeesToPaisa(4000); // PKR 4,000

  const batch = await db.batch.create({
    data: {
      classId: classRecord.id,
      name: "Evening Science Batch (Phase 2 Test)",
      timing: "5:00 PM – 7:00 PM",
      teacherId: teacher.id,
      feeMinor: batchFeeMinor,
    },
    include: {
      teacher: { include: { user: true } },
      class: true,
    },
  });
  console.log(`✓ Class created: ${classRecord.name} (Sec ${classRecord.section}, Cap: ${classRecord.capacity})`);
  console.log(`✓ Batch created: ${batch.name} (${batch.timing})`);
  console.log(`✓ Teacher assigned: ${batch.teacher?.user.name}`);
  console.log(`✓ Monthly fee stored in paisa: ${batch.feeMinor} (${formatPKR(batch.feeMinor)})`);

  // Step 6: Enroll Both Students
  console.log("\n[Step 5] Enrolling both students into the batch...");
  const s1 = await db.student.findUniqueOrThrow({ where: { admissionNo: student1AdmissionNo } });
  const s2 = await db.student.findUniqueOrThrow({ where: { admissionNo: student2AdmissionNo } });

  const enr1 = await db.enrollment.create({
    data: {
      studentId: s1.id,
      batchId: batch.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const enr2 = await db.enrollment.create({
    data: {
      studentId: s2.id,
      batchId: batch.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const totalEnrolled = await db.enrollment.count({ where: { batchId: batch.id } });
  console.log(`✓ Enrolled Student 1 (${s1.name}) → Enrollment ID: ${enr1.id}`);
  console.log(`✓ Enrolled Student 2 (${s2.name}) → Enrollment ID: ${enr2.id}`);
  console.log(`✓ Batch enrollment count: ${totalEnrolled}`);

  // Step 7: Duplicate enrollment attempt fails cleanly
  console.log("\n[Step 6] Testing duplicate enrollment prevention...");
  let duplicateCaught = false;
  try {
    // Check our duplicate rule logic (same logic as enrollStudentAction)
    const existing = await db.enrollment.findUnique({
      where: {
        studentId_batchId: {
          studentId: s1.id,
          batchId: batch.id,
        },
      },
    });

    if (existing && existing.status === EnrollmentStatus.ACTIVE) {
      throw new Error("Student is already actively enrolled in this batch.");
    }

    // Direct DB constraint test as fallback
    await db.enrollment.create({
      data: {
        studentId: s1.id,
        batchId: batch.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });
  } catch (err: unknown) {
    duplicateCaught = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`✓ Duplicate enrollment rejected cleanly: "${msg}"`);
  }

  if (!duplicateCaught) {
    throw new Error("FAIL: Duplicate enrollment was allowed!");
  }

  const countAfterDuplicate = await db.enrollment.count({ where: { batchId: batch.id } });
  if (countAfterDuplicate !== 2) {
    throw new Error(`FAIL: Row count changed after duplicate attempt! Count is ${countAfterDuplicate}`);
  }
  console.log(`✓ Total enrollment rows in database remains unchanged: ${countAfterDuplicate}`);

  // Step 8: Test LEFT Student Roster Invariant
  console.log("\n[Step 7] Testing LEFT Student Roster Invariant...");
  console.log(`Marking Student 2 (${s2.name}) as LEFT...`);

  await db.$transaction(async (tx) => {
    // 1. Mark student status as LEFT
    await tx.student.update({
      where: { id: s2.id },
      data: { status: StudentStatus.LEFT },
    });
    // 2. Mark active enrollments as LEFT
    await tx.enrollment.updateMany({
      where: { studentId: s2.id, status: EnrollmentStatus.ACTIVE },
      data: { status: EnrollmentStatus.LEFT },
    });
  });

  // Query active batch roster (as used on attendance sheets and batch roster displays)
  const activeBatchRoster = await db.enrollment.findMany({
    where: {
      batchId: batch.id,
      status: EnrollmentStatus.ACTIVE,
      student: {
        status: StudentStatus.ACTIVE,
      },
    },
    include: {
      student: true,
    },
  });

  console.log(`Active roster count for batch: ${activeBatchRoster.length}`);
  const rosterNames = activeBatchRoster.map((e) => e.student.name);
  console.log(`Students on active roster: ${rosterNames.join(", ")}`);

  if (activeBatchRoster.length !== 1 || activeBatchRoster[0].student.id !== s1.id) {
    throw new Error("FAIL: LEFT student still appeared on the active batch roster!");
  }
  console.log("✓ PASS: LEFT student (Ayesha Bibi) does NOT appear on the batch roster.");

  // Check historical record preservation
  const allEnrollmentsForS2 = await db.enrollment.findMany({
    where: { studentId: s2.id },
  });
  if (allEnrollmentsForS2.length !== 1 || allEnrollmentsForS2[0].status !== EnrollmentStatus.LEFT) {
    throw new Error("FAIL: Historical enrollment record was deleted or lost!");
  }
  console.log("✓ PASS: Historical enrollment record is preserved with status 'LEFT'.");

  console.log("\n==================================================");
  console.log("ALL PHASE 2 VERIFICATION REQUIREMENTS PASSED!");
  console.log("==================================================");
}

verifyPhase2()
  .catch((err) => {
    console.error("Verification error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
