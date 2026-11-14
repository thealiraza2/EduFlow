-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'TEACHERS', 'PARENTS');

-- CreateTable
CREATE TABLE "TeacherSalary" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "status" "SalaryStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherSalary_month_idx" ON "TeacherSalary"("month");

-- CreateIndex
CREATE INDEX "TeacherSalary_status_idx" ON "TeacherSalary"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSalary_teacherId_month_key" ON "TeacherSalary"("teacherId", "month");

-- CreateIndex
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- AddForeignKey
ALTER TABLE "TeacherSalary" ADD CONSTRAINT "TeacherSalary_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
