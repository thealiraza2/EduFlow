import { PrismaClient, Role, TeacherStatus, StudentStatus, EnrollmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting AcademyHub Phase 3 Comprehensive Seed...");

  // 1. Admin account
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@academyhub.test" },
    update: { passwordHash: adminPasswordHash, role: Role.ADMIN, name: "Academy Director" },
    create: {
      email: "admin@academyhub.test",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Academy Director",
      phone: "03001234567",
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // 2. Teachers
  const teacher1Hash = await bcrypt.hash("Teacher123!", 10);
  const teacherUser1 = await prisma.user.upsert({
    where: { email: "usman.teacher@academyhub.test" },
    update: { passwordHash: teacher1Hash, role: Role.TEACHER, name: "Sir Usman Farooq" },
    create: {
      email: "usman.teacher@academyhub.test",
      passwordHash: teacher1Hash,
      role: Role.TEACHER,
      name: "Sir Usman Farooq",
      phone: "03339998877",
    },
  });

  const teacher1 = await prisma.teacher.upsert({
    where: { userId: teacherUser1.id },
    update: { salaryMinor: 5000000, subjects: ["Mathematics", "Physics"] },
    create: {
      userId: teacherUser1.id,
      salaryMinor: 5000000, // PKR 50,000 in paisa
      subjects: ["Mathematics", "Physics"],
      status: TeacherStatus.ACTIVE,
    },
  });

  const teacher2Hash = await bcrypt.hash("Teacher123!", 10);
  const teacherUser2 = await prisma.user.upsert({
    where: { email: "fatima.teacher@academyhub.test" },
    update: { passwordHash: teacher2Hash, role: Role.TEACHER, name: "Miss Fatima Zahra" },
    create: {
      email: "fatima.teacher@academyhub.test",
      passwordHash: teacher2Hash,
      role: Role.TEACHER,
      name: "Miss Fatima Zahra",
      phone: "03451122334",
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { userId: teacherUser2.id },
    update: { salaryMinor: 4500000, subjects: ["Chemistry", "Biology", "English"] },
    create: {
      userId: teacherUser2.id,
      salaryMinor: 4500000, // PKR 45,000 in paisa
      subjects: ["Chemistry", "Biology", "English"],
      status: TeacherStatus.ACTIVE,
    },
  });
  console.log(`✓ Teachers: ${teacherUser1.name}, ${teacherUser2.name}`);

  // 3. Parent User
  const parentHash = await bcrypt.hash("Parent123!", 10);
  const parentUser = await prisma.user.upsert({
    where: { email: "parent@academyhub.test" },
    update: { passwordHash: parentHash, role: Role.PARENT, name: "Muhammad Tariq" },
    create: {
      email: "parent@academyhub.test",
      passwordHash: parentHash,
      role: Role.PARENT,
      name: "Muhammad Tariq",
      phone: "03009876543",
    },
  });
  console.log(`✓ Parent user: ${parentUser.email}`);

  // 4. Class and Batch
  let class10th = await prisma.class.findFirst({
    where: { name: "10th", section: "A" },
  });
  if (!class10th) {
    class10th = await prisma.class.create({
      data: { name: "10th", section: "A", capacity: 40 },
    });
  }

  let eveningBatch = await prisma.batch.findFirst({
    where: { classId: class10th.id, name: "Evening Batch" },
  });
  if (!eveningBatch) {
    eveningBatch = await prisma.batch.create({
      data: {
        classId: class10th.id,
        name: "Evening Batch",
        timing: "4:00 PM – 6:00 PM",
        teacherId: teacher1.id,
        feeMinor: 400000, // PKR 4,000
      },
    });
  }
  console.log(`✓ Class & Batch: ${class10th.name}-${class10th.section} ${eveningBatch.name}`);

  // 5. Student
  let student = await prisma.student.findFirst({
    where: { admissionNo: "AH-2026-0001" },
  });
  if (!student) {
    student = await prisma.student.create({
      data: {
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
      data: { guardianUserId: parentUser.id },
    });
  }

  // 6. Enrollment
  await prisma.enrollment.upsert({
    where: {
      studentId_batchId: {
        studentId: student.id,
        batchId: eveningBatch.id,
      },
    },
    update: { status: EnrollmentStatus.ACTIVE },
    create: {
      studentId: student.id,
      batchId: eveningBatch.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });
  console.log(`✓ Student ${student.name} enrolled in ${eveningBatch.name}`);

  // 7. Seed realistic timetable for Evening Batch (4–6 PM: Mon–Sat)
  // Delete previous slots for clean seed
  await prisma.timetableSlot.deleteMany({
    where: { batchId: eveningBatch.id },
  });

  const slotsToSeed = [
    // Mon: Maths, Physics
    { dayOfWeek: 1, startTime: "16:00", endTime: "17:00", subject: "Maths", teacherId: teacher1.id, room: "Hall 1" },
    { dayOfWeek: 1, startTime: "17:00", endTime: "18:00", subject: "Physics", teacherId: teacher1.id, room: "Hall 1" },
    // Tue: Physics, Chemistry
    { dayOfWeek: 2, startTime: "16:00", endTime: "17:00", subject: "Physics", teacherId: teacher1.id, room: "Hall 1" },
    { dayOfWeek: 2, startTime: "17:00", endTime: "18:00", subject: "Chemistry", teacherId: teacher2.id, room: "Chemistry Lab" },
    // Wed: English, Chemistry
    { dayOfWeek: 3, startTime: "16:00", endTime: "17:00", subject: "English", teacherId: teacher2.id, room: "Room 102" },
    { dayOfWeek: 3, startTime: "17:00", endTime: "18:00", subject: "Chemistry", teacherId: teacher2.id, room: "Chemistry Lab" },
    // Thu: Chemistry, Biology
    { dayOfWeek: 4, startTime: "16:00", endTime: "17:00", subject: "Chemistry", teacherId: teacher2.id, room: "Chemistry Lab" },
    { dayOfWeek: 4, startTime: "17:00", endTime: "18:00", subject: "Biology", teacherId: teacher2.id, room: "Bio Lab" },
    // Fri: Biology, Maths
    { dayOfWeek: 5, startTime: "16:00", endTime: "17:00", subject: "Biology", teacherId: teacher2.id, room: "Bio Lab" },
    { dayOfWeek: 5, startTime: "17:00", endTime: "18:00", subject: "Maths", teacherId: teacher1.id, room: "Hall 1" },
    // Sat: Weekly Test
    { dayOfWeek: 6, startTime: "16:00", endTime: "18:00", subject: "Weekly Assessment Test", teacherId: teacher1.id, room: "Exam Hall" },
  ];

  for (const s of slotsToSeed) {
    await prisma.timetableSlot.create({
      data: {
        batchId: eveningBatch.id,
        ...s,
      },
    });
  }

  console.log(`✓ Seeded ${slotsToSeed.length} weekly timetable slots for ${eveningBatch.name}`);
  console.log("Phase 3 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
