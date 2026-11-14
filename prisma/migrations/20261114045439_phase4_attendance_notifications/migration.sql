-- CreateEnum
CREATE TYPE "NotificationTrigger" AS ENUM ('ABSENCE', 'FEE_REMINDER', 'RESULT', 'CUSTOM');

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "recipient" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "trigger" "NotificationTrigger" NOT NULL DEFAULT 'CUSTOM',
ALTER COLUMN "template" SET DEFAULT 'ABSENCE_NOTIFICATION';

-- CreateIndex
CREATE INDEX "NotificationLog_studentId_idx" ON "NotificationLog"("studentId");

-- CreateIndex
CREATE INDEX "NotificationLog_trigger_idx" ON "NotificationLog"("trigger");

-- CreateIndex
CREATE INDEX "NotificationLog_referenceId_idx" ON "NotificationLog"("referenceId");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
