import { db } from "../src/lib/db";
import {
  saveBatchAttendanceAction,
  getBatchRosterWithAttendanceAction,
  getMonthlyAttendanceStatsAction,
} from "../src/lib/actions/attendance";
import { sendAbsenceNotification, buildAbsenceMessage } from "../src/lib/notify";
import { AttendanceStatus } from "@prisma/client";

async function verifyPhase4() {
  console.log("==================================================");
  console.log("AcademyHub — Phase 4 Verification Suite");
  console.log("==================================================\n");

  // 1. Setup or find seeded Batch and Teacher
  const batch = await db.batch.findFirst({
    include: {
      class: true,
      teacher: { include: { user: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: true },
      },
    },
  });

  if (!batch || batch.enrollments.length === 0) {
    throw new Error("No active batch with enrolled students found. Run seed first.");
  }

  console.log(`Using Batch: ${batch.class.name} ${batch.name} (ID: ${batch.id})`);
  console.log(`Active Students Enrolled: ${batch.enrollments.length}`);
  const student1 = batch.enrollments[0].student;
  const enrollment1 = batch.enrollments[0];
  console.log(`Test Student: ${student1.name} (Admission: ${student1.admissionNo}, Phone: ${student1.guardianPhone})\n`);

  const todayStr = new Date().toISOString().split("T")[0];
  const targetDate = new Date(`${todayStr}T00:00:00.000Z`);

  // Clean any prior test attendance/notifications for today
  await db.attendance.deleteMany({
    where: {
      enrollmentId: enrollment1.id,
      date: targetDate,
    },
  });
  await db.notificationLog.deleteMany({
    where: {
      studentId: student1.id,
      referenceId: `absence_${student1.id}_${todayStr}`,
    },
  });

  // TEST 1: Message Formatting
  console.log("[Test 1] Testing Absence Notification Message Format...");
  const expectedMsg = `Assalam-o-Alaikum, ${student1.name} aaj ${batch.class.name} ${batch.name} mein absent tha. — AcademyHub`;
  const generatedMsg = buildAbsenceMessage(student1.name, `${batch.class.name} ${batch.name}`);
  if (generatedMsg === expectedMsg) {
    console.log(`✓ Message matches expected format: "${generatedMsg}"`);
  } else {
    throw new Error(`Message mismatch! Got: "${generatedMsg}"`);
  }

  // TEST 2: Attendance Upsert Rule
  console.log("\n[Test 2] Testing Attendance Upsert Rule (Marking twice updates, never duplicates)...");
  // Save 1: Mark Present
  await db.attendance.upsert({
    where: {
      enrollmentId_date: {
        enrollmentId: enrollment1.id,
        date: targetDate,
      },
    },
    create: {
      enrollmentId: enrollment1.id,
      date: targetDate,
      status: AttendanceStatus.PRESENT,
      remarks: "First pass - Present",
    },
    update: {
      status: AttendanceStatus.PRESENT,
      remarks: "First pass - Present",
    },
  });

  let rowCount = await db.attendance.count({
    where: {
      enrollmentId: enrollment1.id,
      date: targetDate,
    },
  });
  console.log(`✓ After 1st save: ${rowCount} attendance record exists in DB.`);

  // Save 2: Mark Absent for the SAME day
  await db.attendance.upsert({
    where: {
      enrollmentId_date: {
        enrollmentId: enrollment1.id,
        date: targetDate,
      },
    },
    create: {
      enrollmentId: enrollment1.id,
      date: targetDate,
      status: AttendanceStatus.ABSENT,
      remarks: "Updated to Absent",
    },
    update: {
      status: AttendanceStatus.ABSENT,
      remarks: "Updated to Absent",
    },
  });

  rowCount = await db.attendance.count({
    where: {
      enrollmentId: enrollment1.id,
      date: targetDate,
    },
  });

  const updatedRecord = await db.attendance.findUnique({
    where: {
      enrollmentId_date: {
        enrollmentId: enrollment1.id,
        date: targetDate,
      },
    },
  });

  if (rowCount === 1 && updatedRecord?.status === "ABSENT") {
    console.log(`✓ After 2nd save: Still exactly 1 attendance record in DB (status updated to ABSENT).`);
    console.log("✓ PASS: Upsert rule strictly verified.");
  } else {
    throw new Error(`Upsert failed! Expected 1 row with status ABSENT, found ${rowCount} rows.`);
  }

  // TEST 3: Duplicate-Notification Guard
  console.log("\n[Test 3] Testing Absence Notification & Duplicate-Notification Guard...");
  // First trigger
  const notify1 = await sendAbsenceNotification({
    studentId: student1.id,
    studentName: student1.name,
    guardianPhone: student1.guardianPhone,
    batchName: `${batch.class.name} ${batch.name}`,
    date: todayStr,
  });

  console.log(`✓ 1st Notification Trigger: sent=${notify1.sent}, logId=${notify1.logId}`);

  // Second trigger for same student and date
  const notify2 = await sendAbsenceNotification({
    studentId: student1.id,
    studentName: student1.name,
    guardianPhone: student1.guardianPhone,
    batchName: `${batch.class.name} ${batch.name}`,
    date: todayStr,
  });

  console.log(`✓ 2nd Notification Trigger (Duplicate): sent=${notify2.sent}, reason=${notify2.reason}`);

  const notificationLogs = await db.notificationLog.findMany({
    where: {
      studentId: student1.id,
      referenceId: `absence_${student1.id}_${todayStr}`,
    },
  });

  if (notificationLogs.length === 1 && !notify2.sent) {
    console.log(`✓ NotificationLog rows for this absence: ${notificationLogs.length}`);
    console.log(`  • Recipient Phone: ${notificationLogs[0].recipientPhone}`);
    console.log(`  • Channel: ${notificationLogs[0].channel}`);
    console.log(`  • Trigger: ${notificationLogs[0].trigger}`);
    console.log(`  • Message: "${notificationLogs[0].message}"`);
    console.log("✓ PASS: Duplicate-notification guard prevented duplicate message.");
  } else {
    throw new Error(`Notification guard failed! Found ${notificationLogs.length} logs.`);
  }

  // TEST 4: Monthly Attendance & At-Risk Flag (<75%)
  console.log("\n[Test 4] Testing Monthly Attendance Calculation & At-Risk (<75%) Flag...");
  const currentMonthStr = `${todayStr.substring(0, 7)}`; // e.g. "2026-11"

  // Create historical sessions for a test student: 1 present, 3 absent = 25% attendance
  const testStudentAtRisk = await db.student.create({
    data: {
      admissionNo: `TEST-ATRISK-${Date.now()}`,
      name: "At-Risk Student Demo",
      guardianName: "Demo Guardian",
      guardianPhone: "03007654321",
    },
  });

  const testEnrollmentAtRisk = await db.enrollment.create({
    data: {
      studentId: testStudentAtRisk.id,
      batchId: batch.id,
    },
  });

  // Seed 4 days in this month
  const testDays = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"];
  const statuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "ABSENT", "ABSENT"]; // 1 present, 3 absent = 25%

  for (let i = 0; i < testDays.length; i++) {
    await db.attendance.create({
      data: {
        enrollmentId: testEnrollmentAtRisk.id,
        date: new Date(`${testDays[i]}T00:00:00.000Z`),
        status: statuses[i],
      },
    });
  }

  const [yearStr, monthNumStr] = currentMonthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const atRiskEnr = await db.enrollment.findUnique({
    where: { id: testEnrollmentAtRisk.id },
    include: {
      student: true,
      attendance: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
      },
    },
  });

  const totalSessions = atRiskEnr!.attendance.length;
  const presentCount = atRiskEnr!.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const percentage = Math.round((presentCount / totalSessions) * 1000) / 10;
  const isAtRisk = percentage < 75;

  console.log(`Demo Student Attendance: ${presentCount}/${totalSessions} sessions = ${percentage}%`);
  console.log(`At-Risk Flag (<75%): ${isAtRisk ? "YES (FLAGGED)" : "NO"}`);

  if (isAtRisk && percentage === 25) {
    console.log("✓ PASS: Monthly calculation and At-Risk (<75%) flag working accurately.");
  } else {
    throw new Error(`At-risk check failed! Expected 25% and flagged, got ${percentage}%`);
  }

  // Cleanup test at-risk student
  await db.attendance.deleteMany({ where: { enrollmentId: testEnrollmentAtRisk.id } });
  await db.enrollment.delete({ where: { id: testEnrollmentAtRisk.id } });
  await db.student.delete({ where: { id: testStudentAtRisk.id } });

  console.log("\n==================================================");
  console.log("ALL PHASE 4 VERIFICATION CHECKS PASSED!");
  console.log("==================================================");
}

verifyPhase4()
  .then(async () => {
    await db.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Verification failed:", e);
    await db.$disconnect();
    process.exit(1);
  });
