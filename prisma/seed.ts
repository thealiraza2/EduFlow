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
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function resolveSeedPassword(envVar: string, roleLabel: string): string {
  const envVal = process.env[envVar]?.trim();
  if (envVal) {
    return envVal;
  }
  // Generate a random secure temporary password if not provided via environment variable
  // and print ONCE to console (Fix 5)
  const generated = `Seed_${crypto.randomBytes(6).toString("hex")}!`;
  console.log(`🔑 [SEED] Generated temporary password for ${roleLabel} (${envVar} was unset): ${generated}`);
  return generated;
}

async function main() {
  console.log("Starting AcademyHub Multi-Tenant Seed...");

  // In production, NEVER seed demo accounts or test users
  if (process.env.NODE_ENV === "production") {
    console.log("ℹ️ Production environment detected (NODE_ENV=production). Skipping all demo accounts.");
    return;
  }

  // Resolve seed passwords from environment variables or generate randomly
  const superAdminPasswordRaw = resolveSeedPassword("SEED_SUPERADMIN_PASSWORD", "Super Admin");
  const adminPasswordRaw = resolveSeedPassword("SEED_ADMIN_PASSWORD", "Admin Director");
  const teacherPasswordRaw = resolveSeedPassword("SEED_TEACHER_PASSWORD", "Teachers");
  const parentPasswordRaw = resolveSeedPassword("SEED_PARENT_PASSWORD", "Parent");
  const studentPasswordRaw = resolveSeedPassword("SEED_STUDENT_PASSWORD", "Student");

  // Save resolved credentials to .seed-passwords.json (gitignored) for automated test suites
  try {
    const credsPath = path.join(__dirname, "../.seed-passwords.json");
    fs.writeFileSync(
      credsPath,
      JSON.stringify(
        {
          superadmin: superAdminPasswordRaw,
          admin: adminPasswordRaw,
          teacher: teacherPasswordRaw,
          parent: parentPasswordRaw,
          student: studentPasswordRaw,
        },
        null,
        2
      ),
      "utf8"
    );
  } catch (err) {
    // Graceful fallback if filesystem is read-only
  }

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
  const superAdminPassword = await bcrypt.hash(superAdminPasswordRaw, 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@academyhub.test" },
    update: {
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
      name: "Platform Owner",
      mustChangePassword: true,
      academyId: null,
    },
    create: {
      email: "superadmin@academyhub.test",
      passwordHash: superAdminPassword,
      role: Role.SUPER_ADMIN,
      name: "Platform Owner",
      phone: "03000000000",
      mustChangePassword: true,
      academyId: null,
    },
  });
  console.log(`✓ Super Admin: ${superAdmin.email}`);

  // 3. Tenant ADMIN Account (Academy Director)
  const adminPasswordHash = await bcrypt.hash(adminPasswordRaw, 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@academyhub.test" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Academy Director",
      mustChangePassword: true,
      academyId: seedAcademy.id,
    },
    create: {
      email: "admin@academyhub.test",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Academy Director",
      phone: "03001234567",
      mustChangePassword: true,
      academyId: seedAcademy.id,
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // 4. Teachers
  const teacher1Hash = await bcrypt.hash(teacherPasswordRaw, 10);
  const teacherUser1 = await prisma.user.upsert({
    where: { email: "usman.teacher@academyhub.test" },
    update: {
      passwordHash: teacher1Hash,
      role: Role.TEACHER,
      name: "Sir Usman Farooq",
      mustChangePassword: true,
      academyId: seedAcademy.id,
    },
    create: {
      email: "usman.teacher@academyhub.test",
      passwordHash: teacher1Hash,
      role: Role.TEACHER,
      name: "Sir Usman Farooq",
      phone: "03339998877",
      mustChangePassword: true,
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

  const teacher2Hash = await bcrypt.hash(teacherPasswordRaw, 10);
  const teacherUser2 = await prisma.user.upsert({
    where: { email: "fatima.teacher@academyhub.test" },
    update: {
      passwordHash: teacher2Hash,
      role: Role.TEACHER,
      name: "Miss Fatima Zahra",
      mustChangePassword: true,
      academyId: seedAcademy.id,
    },
    create: {
      email: "fatima.teacher@academyhub.test",
      passwordHash: teacher2Hash,
      role: Role.TEACHER,
      name: "Miss Fatima Zahra",
      phone: "03451122334",
      mustChangePassword: true,
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
  const parentHash = await bcrypt.hash(parentPasswordRaw, 10);
  const parentUser = await prisma.user.upsert({
    where: { email: "parent@academyhub.test" },
    update: {
      passwordHash: parentHash,
      role: Role.PARENT,
      name: "Muhammad Tariq",
      mustChangePassword: true,
      academyId: seedAcademy.id,
    },
    create: {
      email: "parent@academyhub.test",
      passwordHash: parentHash,
      role: Role.PARENT,
      name: "Muhammad Tariq",
      phone: "03009876543",
      mustChangePassword: true,
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
  const studentHash = await bcrypt.hash(studentPasswordRaw, 10);
  const studentUser = await prisma.user.upsert({
    where: { email: "student@academyhub.test" },
    update: {
      passwordHash: studentHash,
      role: Role.STUDENT,
      name: "Hamza Tariq",
      mustChangePassword: true,
      academyId: seedAcademy.id,
    },
    create: {
      email: "student@academyhub.test",
      passwordHash: studentHash,
      role: Role.STUDENT,
      name: "Hamza Tariq",
      phone: "03009876543",
      mustChangePassword: true,
      academyId: seedAcademy.id,
    },
  });

  await prisma.student.update({
    where: { id: student.id },
    data: { userId: studentUser.id },
  });
  console.log(`✓ Seeded student login: ${studentUser.email} (${studentPasswordRaw})`);

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

  // ==========================================
  // 17. Seed Boards, Subjects, Chapters & Paper Schemes (Phase 13 Patch)
  // All seeded with verified: false and sourceUrl: null (placeholders)
  // ==========================================
  console.log("Seeding Boards, Subjects, Chapters & Schemes (Unverified placeholders)...");

  const boardsData = [
    {
      name: "BISE Lahore",
      province: "Punjab",
      subjects: [
        {
          name: "Physics",
          className: "9th",
          chapters: [
            { number: 1, title: "Physical Quantities & Measurement" },
            { number: 2, title: "Kinematics" },
            { number: 3, title: "Dynamics & Forces" },
          ],
          scheme: {
            structure: {
              mcq: { count: 12, marksEach: 1 },
              short: { count: 8, marksEach: 2, attempt: 5 },
              long: { count: 2, marksEach: 5, attempt: 2 },
            },
            totalMarks: 38,
            timeMinutes: 90,
          },
        },
        {
          name: "Chemistry",
          className: "9th",
          chapters: [
            { number: 1, title: "Fundamentals of Chemistry" },
            { number: 2, title: "Structure of Atoms" },
            { number: 3, title: "Periodic Table & Periodicity" },
          ],
          scheme: {
            structure: {
              mcq: { count: 12, marksEach: 1 },
              short: { count: 8, marksEach: 2, attempt: 5 },
              long: { count: 2, marksEach: 5, attempt: 2 },
            },
            totalMarks: 38,
            timeMinutes: 90,
          },
        },
      ],
    },
    {
      name: "BISE Karachi",
      province: "Sindh",
      subjects: [
        {
          name: "Physics",
          className: "9th",
          chapters: [
            { number: 1, title: "Introduction to Physics" },
            { number: 2, title: "Kinematics & Motion" },
            { number: 3, title: "Vectors & Scalars" },
          ],
          scheme: {
            structure: {
              mcq: { count: 10, marksEach: 1 },
              short: { count: 6, marksEach: 2, attempt: 4 },
              long: { count: 2, marksEach: 5, attempt: 2 },
            },
            totalMarks: 32,
            timeMinutes: 90,
          },
        },
        {
          name: "Chemistry",
          className: "9th",
          chapters: [
            { number: 1, title: "Introduction to Chemistry" },
            { number: 2, title: "Chemical Reactions" },
            { number: 3, title: "Atomic Structure" },
          ],
          scheme: {
            structure: {
              mcq: { count: 10, marksEach: 1 },
              short: { count: 6, marksEach: 2, attempt: 4 },
              long: { count: 2, marksEach: 5, attempt: 2 },
            },
            totalMarks: 32,
            timeMinutes: 90,
          },
        },
      ],
    },
  ];

  for (const b of boardsData) {
    const board = await prisma.board.upsert({
      where: { name: b.name },
      update: { province: b.province },
      create: { name: b.name, province: b.province },
    });

    for (const s of b.subjects) {
      const subject = await prisma.subject.upsert({
        where: {
          boardId_className_name: {
            boardId: board.id,
            className: s.className,
            name: s.name,
          },
        },
        update: {},
        create: {
          boardId: board.id,
          className: s.className,
          name: s.name,
        },
      });

      for (const ch of s.chapters) {
        await prisma.chapter.upsert({
          where: {
            subjectId_number: {
              subjectId: subject.id,
              number: ch.number,
            },
          },
          update: { title: ch.title },
          create: {
            subjectId: subject.id,
            number: ch.number,
            title: ch.title,
          },
        });
      }

      await prisma.paperScheme.upsert({
        where: {
          boardId_className_subjectId: {
            boardId: board.id,
            className: s.className,
            subjectId: subject.id,
          },
        },
        update: {
          structure: s.scheme.structure,
          totalMarks: s.scheme.totalMarks,
          timeMinutes: s.scheme.timeMinutes,
          sourceUrl: null,
          verified: false,
          verifiedAt: null,
        },
        create: {
          boardId: board.id,
          className: s.className,
          subjectId: subject.id,
          structure: s.scheme.structure,
          totalMarks: s.scheme.totalMarks,
          timeMinutes: s.scheme.timeMinutes,
          sourceUrl: null,
          verified: false,
          verifiedAt: null,
        },
      });
    }

    console.log(`✓ Seeded Board: ${board.name} (${board.province}) with 2 subjects, chapters, and unverified schemes`);
  }

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
