import {
  PrismaClient,
  Role,
  TeacherStatus,
  StudentStatus,
  EnrollmentStatus,
  AcademyPlan,
  AcademyStatus,
  TestStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting AcademyHub Multi-Tenant Seed...");

  // 1. Seed Default Academy (Main Campus)
  const seedAcademy = await prisma.academy.upsert({
    where: { id: "seed-academy-id" },
    update: {
      name: "AcademyHub Main Campus",
      slug: "main",
      subdomain: "main",
      plan: AcademyPlan.PRO,
      status: AcademyStatus.ACTIVE,
    },
    create: {
      id: "seed-academy-id",
      name: "AcademyHub Main Campus",
      slug: "main",
      subdomain: "main",
      plan: AcademyPlan.PRO,
      status: AcademyStatus.ACTIVE,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
    },
  });
  console.log(`✓ Seed Academy: ${seedAcademy.name} (slug: ${seedAcademy.slug})`);

  // 2. Platform SUPER_ADMIN Account (No specific academy)
  const superAdminPassword = await bcrypt.hash("SuperAdmin123!", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@academyhub.test" },
    update: {
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
      name: "Platform Owner",
      academyId: null,
    },
    create: {
      email: "superadmin@academyhub.test",
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
      name: "Platform Owner",
      phone: "03000000000",
      academyId: null,
    },
  });
  console.log(`✓ Super Admin: ${superAdmin.email}`);

  // 3. Tenant ADMIN Account (Academy Director)
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@academyhub.test" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Academy Director",
      academyId: seedAcademy.id,
    },
    create: {
      email: "admin@academyhub.test",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Academy Director",
      phone: "03001234567",
      academyId: seedAcademy.id,
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // 4. Teachers
  const teacher1Hash = await bcrypt.hash("Teacher123!", 10);
  const teacherUser1 = await prisma.user.upsert({
    where: { email: "usman.teacher@academyhub.test" },
    update: {
      passwordHash: teacher1Hash,
      role: Role.TEACHER,
      name: "Sir Usman Farooq",
      academyId: seedAcademy.id,
    },
    create: {
      email: "usman.teacher@academyhub.test",
      passwordHash: teacher1Hash,
      role: Role.TEACHER,
      name: "Sir Usman Farooq",
      phone: "03339998877",
      academyId: seedAcademy.id,
    },
  });

  const teacher1 = await prisma.teacher.upsert({
    where: { userId: teacherUser1.id },
    update: {
      salaryMinor: 5000000,
      subjects: ["Mathematics", "Physics"],
      academyId: seedAcademy.id,
    },
    create: {
      userId: teacherUser1.id,
      salaryMinor: 5000000, // PKR 50,000 in paisa
      subjects: ["Mathematics", "Physics"],
      status: TeacherStatus.ACTIVE,
      academyId: seedAcademy.id,
    },
  });

  const teacher2Hash = await bcrypt.hash("Teacher123!", 10);
  const teacherUser2 = await prisma.user.upsert({
    where: { email: "fatima.teacher@academyhub.test" },
    update: {
      passwordHash: teacher2Hash,
      role: Role.TEACHER,
      name: "Miss Fatima Zahra",
      academyId: seedAcademy.id,
    },
    create: {
      email: "fatima.teacher@academyhub.test",
      passwordHash: teacher2Hash,
      role: Role.TEACHER,
      name: "Miss Fatima Zahra",
      phone: "03451122334",
      academyId: seedAcademy.id,
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { userId: teacherUser2.id },
    update: {
      salaryMinor: 4500000,
      subjects: ["Chemistry", "Biology", "English"],
      academyId: seedAcademy.id,
    },
    create: {
      userId: teacherUser2.id,
      salaryMinor: 4500000, // PKR 45,000 in paisa
      subjects: ["Chemistry", "Biology", "English"],
      status: TeacherStatus.ACTIVE,
      academyId: seedAcademy.id,
    },
  });
  console.log(`✓ Teachers: ${teacherUser1.name}, ${teacherUser2.name}`);

  // 5. Parent User
  const parentHash = await bcrypt.hash("Parent123!", 10);
  const parentUser = await prisma.user.upsert({
    where: { email: "parent@academyhub.test" },
    update: {
      passwordHash: parentHash,
      role: Role.PARENT,
      name: "Muhammad Tariq",
      academyId: seedAcademy.id,
    },
    create: {
      email: "parent@academyhub.test",
      passwordHash: parentHash,
      role: Role.PARENT,
      name: "Muhammad Tariq",
      phone: "03009876543",
      academyId: seedAcademy.id,
    },
  });
  console.log(`✓ Parent user: ${parentUser.email}`);

  // 6. Class and Batch
  let class10th = await prisma.class.findFirst({
    where: { academyId: seedAcademy.id, name: "10th", section: "A" },
  });
  if (!class10th) {
    class10th = await prisma.class.create({
      data: {
        academyId: seedAcademy.id,
        name: "10th",
        section: "A",
        capacity: 40,
      },
    });
  }

  let eveningBatch = await prisma.batch.findFirst({
    where: { academyId: seedAcademy.id, classId: class10th.id, name: "Evening Batch" },
  });
  if (!eveningBatch) {
    eveningBatch = await prisma.batch.create({
      data: {
        academyId: seedAcademy.id,
        classId: class10th.id,
        name: "Evening Batch",
        timing: "4:00 PM – 6:00 PM",
        teacherId: teacher1.id,
        feeMinor: 400000, // PKR 4,000
      },
    });
  }
  console.log(`✓ Class & Batch: ${class10th.name}-${class10th.section} ${eveningBatch.name}`);

  // 7. Student
  let student = await prisma.student.findFirst({
    where: { academyId: seedAcademy.id, admissionNo: "AH-2026-0001" },
  });
  if (!student) {
    student = await prisma.student.create({
      data: {
        academyId: seedAcademy.id,
        admissionNo: "AH-2026-0001",
        name: "Hamza Tariq",
        guardianName: "Muhammad Tariq",
        guardianPhone: "03009876543",
        guardianUserId: parentUser.id,
        status: StudentStatus.ACTIVE,
      },
    });
  } else {
    student = await prisma.student.update({
      where: { id: student.id },
      data: { guardianUserId: parentUser.id, academyId: seedAcademy.id },
    });
  }

  // 8. Enrollment
  await prisma.enrollment.upsert({
    where: {
      studentId_batchId: {
        studentId: student.id,
        batchId: eveningBatch.id,
      },
    },
    update: { status: EnrollmentStatus.ACTIVE, academyId: seedAcademy.id },
    create: {
      academyId: seedAcademy.id,
      studentId: student.id,
      batchId: eveningBatch.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });
  console.log(`✓ Student ${student.name} enrolled in ${eveningBatch.name}`);

  // 9. Fee Plan
  await prisma.feePlan.upsert({
    where: { batchId: eveningBatch.id },
    update: {
      monthlyFeeMinor: 400000,
      admissionFeeMinor: 100000,
      lateFineMinor: 20000,
      dueDayOfMonth: 10,
      academyId: seedAcademy.id,
    },
    create: {
      academyId: seedAcademy.id,
      batchId: eveningBatch.id,
      monthlyFeeMinor: 400000,
      admissionFeeMinor: 100000,
      lateFineMinor: 20000,
      dueDayOfMonth: 10,
    },
  });

  // 10. Seed Timetable Slots
  await prisma.timetableSlot.deleteMany({
    where: { batchId: eveningBatch.id },
  });

  const slotsToSeed = [
    { dayOfWeek: 1, startTime: "16:00", endTime: "17:00", subject: "Maths", teacherId: teacher1.id, room: "Hall 1" },
    { dayOfWeek: 1, startTime: "17:00", endTime: "18:00", subject: "Physics", teacherId: teacher1.id, room: "Hall 1" },
    { dayOfWeek: 2, startTime: "16:00", endTime: "17:00", subject: "Physics", teacherId: teacher1.id, room: "Hall 1" },
    { dayOfWeek: 2, startTime: "17:00", endTime: "18:00", subject: "Chemistry", teacherId: teacher2.id, room: "Chemistry Lab" },
    { dayOfWeek: 3, startTime: "16:00", endTime: "17:00", subject: "English", teacherId: teacher2.id, room: "Room 102" },
    { dayOfWeek: 3, startTime: "17:00", endTime: "18:00", subject: "Chemistry", teacherId: teacher2.id, room: "Chemistry Lab" },
    { dayOfWeek: 4, startTime: "16:00", endTime: "17:00", subject: "Chemistry", teacherId: teacher2.id, room: "Chemistry Lab" },
    { dayOfWeek: 4, startTime: "17:00", endTime: "18:00", subject: "Biology", teacherId: teacher2.id, room: "Bio Lab" },
    { dayOfWeek: 5, startTime: "16:00", endTime: "17:00", subject: "Biology", teacherId: teacher2.id, room: "Bio Lab" },
    { dayOfWeek: 5, startTime: "17:00", endTime: "18:00", subject: "Maths", teacherId: teacher1.id, room: "Hall 1" },
    { dayOfWeek: 6, startTime: "16:00", endTime: "18:00", subject: "Weekly Assessment Test", teacherId: teacher1.id, room: "Exam Hall" },
  ];

  for (const s of slotsToSeed) {
    await prisma.timetableSlot.create({
      data: {
        academyId: seedAcademy.id,
        batchId: eveningBatch.id,
        ...s,
      },
    });
  }

  console.log(`✓ Seeded ${slotsToSeed.length} weekly timetable slots for ${eveningBatch.name}`);

  // 11. Student User Account
  const studentHash = await bcrypt.hash("Student123!", 10);
  const studentUser = await prisma.user.upsert({
    where: { email: "student@academyhub.test" },
    update: {
      passwordHash: studentHash,
      role: Role.STUDENT,
      name: "Hamza Tariq",
      academyId: seedAcademy.id,
    },
    create: {
      email: "student@academyhub.test",
      passwordHash: studentHash,
      role: Role.STUDENT,
      name: "Hamza Tariq",
      phone: "03009876543",
      academyId: seedAcademy.id,
    },
  });

  await prisma.student.update({
    where: { id: student.id },
    data: { userId: studentUser.id },
  });
  console.log(`✓ Seeded student login: ${studentUser.email} (Student123!)`);

  // 12. Additional Students for Leaderboard
  const student2 = await prisma.student.upsert({
    where: {
      academyId_admissionNo: { academyId: seedAcademy.id, admissionNo: "AH-2026-0002" },
    },
    update: {},
    create: {
      academyId: seedAcademy.id,
      admissionNo: "AH-2026-0002",
      name: "Ayesha Malik",
      guardianName: "Tariq Malik",
      guardianPhone: "03111223344",
      status: StudentStatus.ACTIVE,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_batchId: {
        studentId: student2.id,
        batchId: eveningBatch.id,
      },
    },
    update: { status: EnrollmentStatus.ACTIVE },
    create: {
      academyId: seedAcademy.id,
      studentId: student2.id,
      batchId: eveningBatch.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const student3 = await prisma.student.upsert({
    where: {
      academyId_admissionNo: { academyId: seedAcademy.id, admissionNo: "AH-2026-0003" },
    },
    update: {},
    create: {
      academyId: seedAcademy.id,
      admissionNo: "AH-2026-0003",
      name: "Bilal Ahmed",
      guardianName: "Ahmed Khan",
      guardianPhone: "03215554433",
      status: StudentStatus.ACTIVE,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_batchId: {
        studentId: student3.id,
        batchId: eveningBatch.id,
      },
    },
    update: { status: EnrollmentStatus.ACTIVE },
    create: {
      academyId: seedAcademy.id,
      studentId: student3.id,
      batchId: eveningBatch.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  // 13. Seed Online Test with Questions (Phase 12)
  let onlineTest = await prisma.test.findFirst({
    where: { academyId: seedAcademy.id, batchId: eveningBatch.id, title: "Midterm Physics Online Test" },
  });

  if (!onlineTest) {
    onlineTest = await prisma.test.create({
      data: {
        academyId: seedAcademy.id,
        batchId: eveningBatch.id,
        subject: "Physics",
        title: "Midterm Physics Online Test",
        totalMarks: 10,
        date: new Date(),
        status: TestStatus.PUBLISHED,
        durationMinutes: 15,
        negativeMarking: 0.25,
        shuffleQuestions: true,
        isClosed: false,
      },
    });
  }

  // Clear and recreate questions for deterministic setup
  await prisma.question.deleteMany({ where: { testId: onlineTest.id } });

  const q1 = await prisma.question.create({
    data: {
      academyId: seedAcademy.id,
      testId: onlineTest.id,
      type: "MCQ",
      text: "What is the SI unit of electric current?",
      options: ["Ampere", "Volt", "Ohm", "Watt"],
      correctAnswer: "Ampere",
      marks: 2.0,
      order: 1,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      academyId: seedAcademy.id,
      testId: onlineTest.id,
      type: "MCQ",
      text: "Which of the following is a vector quantity?",
      options: ["Speed", "Velocity", "Distance", "Mass"],
      correctAnswer: "Velocity",
      marks: 2.0,
      order: 2,
    },
  });

  const q3 = await prisma.question.create({
    data: {
      academyId: seedAcademy.id,
      testId: onlineTest.id,
      type: "MCQ",
      text: "What is the acceleration due to gravity on Earth's surface?",
      options: ["9.8 m/s²", "8.9 m/s²", "10.8 m/s²", "7.8 m/s²"],
      correctAnswer: "9.8 m/s²",
      marks: 2.0,
      order: 3,
    },
  });

  const q4 = await prisma.question.create({
    data: {
      academyId: seedAcademy.id,
      testId: onlineTest.id,
      type: "MCQ",
      text: "Light year is a unit of which physical quantity?",
      options: ["Time", "Light intensity", "Astronomical distance", "Velocity"],
      correctAnswer: "Astronomical distance",
      marks: 2.0,
      order: 4,
    },
  });

  const q5 = await prisma.question.create({
    data: {
      academyId: seedAcademy.id,
      testId: onlineTest.id,
      type: "SHORT",
      text: "State Newton's First Law of Motion in one sentence.",
      options: undefined,
      correctAnswer: "An object remains at rest or in uniform motion unless acted upon by a net external force.",
      marks: 2.0,
      order: 5,
    },
  });

  // Seed sample completed attempts for Ayesha & Bilal to populate leaderboard
  await prisma.testAttempt.deleteMany({ where: { testId: onlineTest.id } });

  const now = new Date();
  // Ayesha: Score 8.0, Time taken: 300s (5 mins)
  const ayeshaStart = new Date(now.getTime() - 400 * 1000);
  const ayeshaSubmit = new Date(now.getTime() - 100 * 1000); // 300 seconds
  await prisma.testAttempt.create({
    data: {
      academyId: seedAcademy.id,
      testId: onlineTest.id,
      studentId: student2.id,
      startedAt: ayeshaStart,
      submittedAt: ayeshaSubmit,
      score: 8.0,
      scoreMinor: 800,
      status: "GRADED",
      tabSwitchCount: 1,
    },
  });

  // Bilal: Score 8.0, Time taken: 450s (Tie on score with Ayesha, but took longer)
  const bilalStart = new Date(now.getTime() - 600 * 1000);
  const bilalSubmit = new Date(now.getTime() - 150 * 1000); // 450 seconds
  await prisma.testAttempt.create({
    data: {
      academyId: seedAcademy.id,
      testId: onlineTest.id,
      studentId: student3.id,
      startedAt: bilalStart,
      submittedAt: bilalSubmit,
      score: 8.0,
      scoreMinor: 800,
      status: "GRADED",
      tabSwitchCount: 0,
    },
  });

  console.log(`✓ Seeded Online Test: "${onlineTest.title}" with 5 questions and 2 completed attempts`);
  console.log("Multi-Tenant Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
