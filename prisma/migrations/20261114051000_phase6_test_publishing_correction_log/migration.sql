-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TestResult" ADD COLUMN     "correctionLog" TEXT;

-- CreateIndex
CREATE INDEX "Test_status_idx" ON "Test"("status");
