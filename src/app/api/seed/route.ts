import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  Role,
  TeacherStatus,
  StudentStatus,
  EnrollmentStatus,
  AcademyPlan,
  AcademyStatus,
  TestStatus,
  InvoiceStatus,
  QuestionType,
} from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "eduflow-seed-secret-2026") {
    return NextResponse.json({ error: "Unauthorized. Invalid secret." }, { status: 401 });
  }

  try {
    const passwordRaw = "TestPassword123!";
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    // 1. Academy
    const academy = await db.academy.upsert({
      where: { id: "seed-academy-id" },
      update: {
        name: "EduFlow Main Campus",
        slug: "main",
        subdomain: "main",
        plan: AcademyPlan.PRO,
        status: AcademyStatus.ACTIVE,
      },
      create: {
        id: "seed-academy-id",
        name: "EduFlow Main Campus",
        slug: "main",
        subdomain: "main",
        plan: AcademyPlan.PRO,
        status: AcademyStatus.ACTIVE,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // 2. Super Admin
    await db.user.upsert({
      where: { email: "superadmin@eduflow.test" },
      update: {
        passwordHash,
        role: Role.SUPER_ADMIN,
        name: "Platform Owner",
        mustChangePassword: false,
        academyId: null,
      },
      create: {
        email: "superadmin@eduflow.test",
        passwordHash,
        role: Role.SUPER_ADMIN,
        name: "Platform Owner",
        phone: "03000000000",
        mustChangePassword: false,
        academyId: null,
      },
    });

    // 3. Admin Director
    await db.user.upsert({
      where: { email: "admin@eduflow.test" },
      update: {
        passwordHash,
        role: Role.ADMIN,
        name: "Academy Director",
        mustChangePassword: false,
        academyId: academy.id,
      },
      create: {
        email: "admin@eduflow.test",
        passwordHash,
        role: Role.ADMIN,
        name: "Academy Director",
        phone: "03001234567",
        mustChangePassword: false,
        academyId: academy.id,
      },
    });

    // 4. Teacher 1 - Sir Usman Farooq
    const teacherUser1 = await db.user.upsert({
      where: { email: "usman.teacher@eduflow.test" },
      update: {
        passwordHash,
        role: Role.TEACHER,
        name: "Sir Usman Farooq",
        mustChangePassword: false,
        academyId: academy.id,
      },
      create: {
        email: "usman.teacher@eduflow.test",
        passwordHash,
        role: Role.TEACHER,
        name: "Sir Usman Farooq",
        phone: "03339998877",
        mustChangePassword: false,
        academyId: academy.id,
      },
    });

    const teacher1 = await db.teacher.upsert({
      where: { userId: teacherUser1.id },
      update: {
        salaryMinor: 5000000,
        subjects: ["Mathematics", "Physics"],
        academyId: academy.id,
        status: TeacherStatus.ACTIVE,
      },
      create: {
        userId: teacherUser1.id,
        salaryMinor: 5000000,
        subjects: ["Mathematics", "Physics"],
        status: TeacherStatus.ACTIVE,
        academyId: academy.id,
      },
    });

    // 5. Teacher 2 - Miss Fatima Zahra
    const teacherUser2 = await db.user.upsert({
      where: { email: "fatima.teacher@eduflow.test" },
      update: {
        passwordHash,
        role: Role.TEACHER,
        name: "Miss Fatima Zahra",
        mustChangePassword: false,
        academyId: academy.id,
      },
      create: {
        email: "fatima.teacher@eduflow.test",
        passwordHash,
        role: Role.TEACHER,
        name: "Miss Fatima Zahra",
        phone: "03451122334",
        mustChangePassword: false,
        academyId: academy.id,
      },
    });

    await db.teacher.upsert({
      where: { userId: teacherUser2.id },
      update: {
        salaryMinor: 4500000,
        subjects: ["Chemistry", "Biology", "English"],
        academyId: academy.id,
        status: TeacherStatus.ACTIVE,
      },
      create: {
        userId: teacherUser2.id,
        salaryMinor: 4500000,
        subjects: ["Chemistry", "Biology", "English"],
        status: TeacherStatus.ACTIVE,
        academyId: academy.id,
      },
    });

    // 6. Parent User - Muhammad Tariq
    const parentUser = await db.user.upsert({
      where: { email: "parent@eduflow.test" },
      update: {
        passwordHash,
        role: Role.PARENT,
        name: "Muhammad Tariq",
        mustChangePassword: false,
        academyId: academy.id,
      },
      create: {
        email: "parent@eduflow.test",
        passwordHash,
        role: Role.PARENT,
        name: "Muhammad Tariq",
        phone: "03009876543",
        mustChangePassword: false,
        academyId: academy.id,
      },
    });

    // 7. Student User - Hamza Tariq
    const studentUser = await db.user.upsert({
      where: { email: "student@eduflow.test" },
      update: {
        passwordHash,
        role: Role.STUDENT,
        name: "Hamza Tariq",
        mustChangePassword: false,
        academyId: academy.id,
      },
      create: {
        email: "student@eduflow.test",
        passwordHash,
        role: Role.STUDENT,
        name: "Hamza Tariq",
        phone: "03009876543",
        mustChangePassword: false,
        academyId: academy.id,
      },
    });

    // 8. Class & Batch
    let class10th = await db.class.findFirst({
      where: { academyId: academy.id, name: "10th", section: "A" },
    });
    if (!class10th) {
      class10th = await db.class.create({
        data: {
          academyId: academy.id,
          name: "10th",
          section: "A",
          capacity: 40,
        },
      });
    }

    let eveningBatch = await db.batch.findFirst({
      where: { academyId: academy.id, classId: class10th.id, name: "Evening Batch" },
    });
    if (!eveningBatch) {
      eveningBatch = await db.batch.create({
        data: {
          academyId: academy.id,
          classId: class10th.id,
          name: "Evening Batch",
          timing: "4:00 PM – 6:00 PM",
          teacherId: teacher1.id,
          feeMinor: 400000,
        },
      });
    }

    // Fee plan
    await db.feePlan.upsert({
      where: { batchId: eveningBatch.id },
      update: {
        monthlyFeeMinor: 400000,
        admissionFeeMinor: 100000,
        lateFineMinor: 20000,
        dueDayOfMonth: 10,
        academyId: academy.id,
      },
      create: {
        academyId: academy.id,
        batchId: eveningBatch.id,
        monthlyFeeMinor: 400000,
        admissionFeeMinor: 100000,
        lateFineMinor: 20000,
        dueDayOfMonth: 10,
      },
    });

    // 9. Students
    // Hamza Tariq
    let student1 = await db.student.findFirst({
      where: { academyId: academy.id, admissionNo: "EF-2026-0001" },
    });
    if (!student1) {
      student1 = await db.student.create({
        data: {
          academyId: academy.id,
          admissionNo: "EF-2026-0001",
          name: "Hamza Tariq",
          guardianName: "Muhammad Tariq",
          guardianPhone: "03009876543",
          guardianUserId: parentUser.id,
          userId: studentUser.id,
          status: StudentStatus.ACTIVE,
        },
      });
    } else {
      student1 = await db.student.update({
        where: { id: student1.id },
        data: {
          guardianUserId: parentUser.id,
          userId: studentUser.id,
          status: StudentStatus.ACTIVE,
        },
      });
    }

    await db.enrollment.upsert({
      where: {
        studentId_batchId: {
          studentId: student1.id,
          batchId: eveningBatch.id,
        },
      },
      update: { status: EnrollmentStatus.ACTIVE },
      create: {
        academyId: academy.id,
        studentId: student1.id,
        batchId: eveningBatch.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    // Ayesha Malik
    let student2 = await db.student.findFirst({
      where: { academyId: academy.id, admissionNo: "EF-2026-0002" },
    });
    if (!student2) {
      student2 = await db.student.create({
        data: {
          academyId: academy.id,
          admissionNo: "EF-2026-0002",
          name: "Ayesha Malik",
          guardianName: "Tariq Malik",
          guardianPhone: "03111223344",
          status: StudentStatus.ACTIVE,
        },
      });
    }

    await db.enrollment.upsert({
      where: {
        studentId_batchId: {
          studentId: student2.id,
          batchId: eveningBatch.id,
        },
      },
      update: { status: EnrollmentStatus.ACTIVE },
      create: {
        academyId: academy.id,
        studentId: student2.id,
        batchId: eveningBatch.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    // Bilal Ahmed
    let student3 = await db.student.findFirst({
      where: { academyId: academy.id, admissionNo: "EF-2026-0003" },
    });
    if (!student3) {
      student3 = await db.student.create({
        data: {
          academyId: academy.id,
          admissionNo: "EF-2026-0003",
          name: "Bilal Ahmed",
          guardianName: "Ahmed Khan",
          guardianPhone: "03215554433",
          status: StudentStatus.ACTIVE,
        },
      });
    }

    await db.enrollment.upsert({
      where: {
        studentId_batchId: {
          studentId: student3.id,
          batchId: eveningBatch.id,
        },
      },
      update: { status: EnrollmentStatus.ACTIVE },
      create: {
        academyId: academy.id,
        studentId: student3.id,
        batchId: eveningBatch.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    // 10. November 2026 Invoices (Base PKR 4,000 + Late fine PKR 200 = PKR 4,200)
    for (const s of [student1, student2, student3]) {
      await db.feeInvoice.upsert({
        where: {
          studentId_batchId_month: {
            studentId: s.id,
            batchId: eveningBatch.id,
            month: "2026-11",
          },
        },
        update: {
          amountMinor: 400000,
          fineMinor: 20000,
          totalMinor: 420000,
          status: InvoiceStatus.UNPAID,
        },
        create: {
          academyId: academy.id,
          studentId: s.id,
          batchId: eveningBatch.id,
          month: "2026-11",
          amountMinor: 400000,
          fineMinor: 20000,
          totalMinor: 420000,
          status: InvoiceStatus.UNPAID,
        },
      });
    }

    // 11. Midterm Physics Online Test
    let physicsTest = await db.test.findFirst({
      where: { academyId: academy.id, title: "Midterm Physics Online Test" },
    });
    if (!physicsTest) {
      physicsTest = await db.test.create({
        data: {
          id: "seed-online-test-physics",
          academyId: academy.id,
          batchId: eveningBatch.id,
          title: "Midterm Physics Online Test",
          subject: "Physics",
          totalMarks: 10,
          date: new Date("2026-11-15T10:00:00Z"),
          status: TestStatus.PUBLISHED,
          durationMinutes: 30,
          shuffleQuestions: false,
          negativeMarking: 0,
          isClosed: false,
          publishedAt: new Date("2026-11-15T12:00:00Z"),
        },
      });

      const questions = [
        { type: QuestionType.MCQ, text: "Which unit is used to measure electric current?", options: ["Volt", "Ampere", "Ohm", "Watt"], correctAnswer: "Ampere", marks: 2, order: 1 },
        { type: QuestionType.MCQ, text: "What is the rate of change of displacement?", options: ["Speed", "Velocity", "Acceleration", "Momentum"], correctAnswer: "Velocity", marks: 2, order: 2 },
        { type: QuestionType.MCQ, text: "What is acceleration due to gravity near Earth's surface?", options: ["9.8 m/s²", "8.9 m/s²", "10.8 m/s²", "9.0 m/s²"], correctAnswer: "9.8 m/s²", marks: 2, order: 3 },
        { type: QuestionType.MCQ, text: "Which telescope uses mirrors instead of lenses?", options: ["Refracting", "Astronomical", "Reflecting", "Terrestrial"], correctAnswer: "Reflecting", marks: 2, order: 4 },
        { type: QuestionType.SHORT, text: "State Newton's First Law of Motion in one sentence.", options: null, correctAnswer: "An object remains at rest or in uniform motion unless acted upon by a net force.", marks: 2, order: 5 },
      ];

      for (const q of questions) {
        await db.question.create({
          data: {
            academyId: academy.id,
            testId: physicsTest.id,
            type: q.type,
            text: q.text,
            options: q.options ?? undefined,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            order: q.order,
          },
        });
      }
    }

    // 12. Mathematics Mid-Term — Grade 9 Test
    await db.test.upsert({
      where: { id: "seed-draft-test-grade9" },
      update: {
        title: "Mathematics Mid-Term — Grade 9",
        subject: "Mathematics",
        status: TestStatus.DRAFT,
      },
      create: {
        id: "seed-draft-test-grade9",
        academyId: academy.id,
        batchId: eveningBatch.id,
        title: "Mathematics Mid-Term — Grade 9",
        subject: "Mathematics",
        totalMarks: 75,
        date: new Date("2026-11-20T09:00:00Z"),
        status: TestStatus.DRAFT,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database successfully seeded with demo accounts! All passwords set to TestPassword123!",
      accounts: [
        { role: "SUPER_ADMIN", email: "superadmin@eduflow.test", password: passwordRaw },
        { role: "ADMIN", email: "admin@eduflow.test", password: passwordRaw },
        { role: "TEACHER", email: "usman.teacher@eduflow.test", password: passwordRaw },
        { role: "TEACHER", email: "fatima.teacher@eduflow.test", password: passwordRaw },
        { role: "PARENT", email: "parent@eduflow.test", password: passwordRaw },
        { role: "STUDENT", email: "student@eduflow.test", password: passwordRaw },
      ],
    });
  } catch (error: any) {
    console.error("Seed endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
