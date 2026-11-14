-- CreateEnum
CREATE TYPE "AcademyPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "AcademyStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- CreateTable Academy FIRST so foreign keys and backfill can reference it
CREATE TABLE "Academy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subdomain" TEXT,
    "plan" "AcademyPlan" NOT NULL DEFAULT 'PRO',
    "status" "AcademyStatus" NOT NULL DEFAULT 'ACTIVE',
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Academy_pkey" PRIMARY KEY ("id")
);

-- Backfill: Seed Academy row for existing data
INSERT INTO "Academy" ("id", "name", "slug", "subdomain", "plan", "status", "trialEndsAt", "createdAt", "updatedAt")
VALUES ('seed-academy-id', 'AcademyHub Main Campus', 'main', 'main', 'PRO', 'ACTIVE', NOW() + INTERVAL '14 days', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- DropIndex
DROP INDEX "Student_admissionNo_key";

-- DropIndex
DROP INDEX "TimetableSlot_batchId_dayOfWeek_startTime_key";

-- AlterTable with default 'seed-academy-id' to backfill existing records
ALTER TABLE "Announcement" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "Attendance" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "Batch" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "Class" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "Enrollment" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "FeeInvoice" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "FeePayment" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "FeePlan" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "NotificationLog" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "Student" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "Teacher" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "TeacherSalary" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "Test" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "TestResult" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "TimetableSlot" ADD COLUMN "academyId" TEXT NOT NULL DEFAULT 'seed-academy-id';
ALTER TABLE "User" ADD COLUMN "academyId" TEXT DEFAULT 'seed-academy-id';

-- Drop the temporary DEFAULT constraints so future inserts must explicitly provide academyId
ALTER TABLE "Announcement" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "Attendance" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "Batch" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "Class" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "Enrollment" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "FeeInvoice" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "FeePayment" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "FeePlan" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "NotificationLog" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "Teacher" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "TeacherSalary" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "Test" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "TestResult" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "TimetableSlot" ALTER COLUMN "academyId" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "academyId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Academy_slug_key" ON "Academy"("slug");
CREATE UNIQUE INDEX "Academy_subdomain_key" ON "Academy"("subdomain");
CREATE INDEX "Academy_slug_idx" ON "Academy"("slug");
CREATE INDEX "Academy_status_idx" ON "Academy"("status");

CREATE INDEX "Announcement_academyId_idx" ON "Announcement"("academyId");
CREATE INDEX "Attendance_academyId_idx" ON "Attendance"("academyId");
CREATE UNIQUE INDEX "Attendance_academyId_enrollmentId_date_key" ON "Attendance"("academyId", "enrollmentId", "date");

CREATE INDEX "Batch_academyId_idx" ON "Batch"("academyId");
CREATE INDEX "Class_academyId_idx" ON "Class"("academyId");
CREATE UNIQUE INDEX "Class_academyId_name_section_key" ON "Class"("academyId", "name", "section");

CREATE INDEX "Enrollment_academyId_idx" ON "Enrollment"("academyId");
CREATE UNIQUE INDEX "Enrollment_academyId_studentId_batchId_key" ON "Enrollment"("academyId", "studentId", "batchId");

CREATE INDEX "FeeInvoice_academyId_idx" ON "FeeInvoice"("academyId");
CREATE UNIQUE INDEX "FeeInvoice_academyId_studentId_batchId_month_key" ON "FeeInvoice"("academyId", "studentId", "batchId", "month");

CREATE INDEX "FeePayment_academyId_idx" ON "FeePayment"("academyId");
CREATE INDEX "FeePlan_academyId_idx" ON "FeePlan"("academyId");
CREATE INDEX "NotificationLog_academyId_idx" ON "NotificationLog"("academyId");

CREATE INDEX "Student_academyId_idx" ON "Student"("academyId");
CREATE UNIQUE INDEX "Student_academyId_admissionNo_key" ON "Student"("academyId", "admissionNo");

CREATE INDEX "Teacher_academyId_idx" ON "Teacher"("academyId");
CREATE INDEX "TeacherSalary_academyId_idx" ON "TeacherSalary"("academyId");
CREATE UNIQUE INDEX "TeacherSalary_academyId_teacherId_month_key" ON "TeacherSalary"("academyId", "teacherId", "month");

CREATE INDEX "Test_academyId_idx" ON "Test"("academyId");
CREATE INDEX "TestResult_academyId_idx" ON "TestResult"("academyId");
CREATE UNIQUE INDEX "TestResult_academyId_testId_studentId_key" ON "TestResult"("academyId", "testId", "studentId");

CREATE INDEX "TimetableSlot_academyId_idx" ON "TimetableSlot"("academyId");
CREATE UNIQUE INDEX "TimetableSlot_academyId_batchId_dayOfWeek_startTime_key" ON "TimetableSlot"("academyId", "batchId", "dayOfWeek", "startTime");

CREATE INDEX "User_academyId_idx" ON "User"("academyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Class" ADD CONSTRAINT "Class_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePlan" ADD CONSTRAINT "FeePlan_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Test" ADD CONSTRAINT "Test_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherSalary" ADD CONSTRAINT "TeacherSalary_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
