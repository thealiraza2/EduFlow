-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'LONG';

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "schemeId" TEXT;

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperScheme" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "timeMinutes" INTEGER NOT NULL,
    "sourceUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperScheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Board_name_key" ON "Board"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_boardId_className_name_key" ON "Subject"("boardId", "className", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_subjectId_number_key" ON "Chapter"("subjectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "PaperScheme_boardId_className_subjectId_key" ON "PaperScheme"("boardId", "className", "subjectId");

-- CreateIndex
CREATE INDEX "Test_schemeId_idx" ON "Test"("schemeId");

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "PaperScheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperScheme" ADD CONSTRAINT "PaperScheme_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperScheme" ADD CONSTRAINT "PaperScheme_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
