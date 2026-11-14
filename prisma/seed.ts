import {
  PrismaClient,
  Role,
  TeacherStatus,
  StudentStatus,
  EnrollmentStatus,
  AcademyPlan,
  AcademyStatus,
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
