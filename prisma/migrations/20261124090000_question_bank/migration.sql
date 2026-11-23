-- CreateEnum
CREATE TYPE "BankQuestionType" AS ENUM ('MCQ', 'SHORT', 'LONG');

-- CreateEnum
CREATE TYPE "BankQuestionSource" AS ENUM ('EXERCISE', 'PAST_PAPER', 'ADDITIONAL', 'CONCEPTUAL');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEWED');

-- CreateTable
CREATE TABLE "TextbookAuthority" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextbookAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamBoard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectUr" TEXT,
    "edition" TEXT NOT NULL,
    "sessionFrom" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookUnit" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleUr" TEXT,

    CONSTRAINT "BookUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookTopic" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleUr" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BookTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankQuestion" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "topicId" TEXT,
    "type" "BankQuestionType" NOT NULL,
    "source" "BankQuestionSource" NOT NULL DEFAULT 'EXERCISE',
    "textEn" TEXT,
    "textUr" TEXT,
    "options" JSONB,
    "answer" TEXT,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "parts" JSONB,
    "imageUrl" TEXT,
    "pastPaperRef" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardScheme" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "examBoardId" TEXT,
    "session" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "timeMinutes" INTEGER,
    "structure" JSONB NOT NULL,
    "sourceUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPaper" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "bookId" TEXT,
    "title" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "timeMinutes" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'dual',
    "sections" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedPaper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TextbookAuthority_code_key" ON "TextbookAuthority"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBoard_code_key" ON "ExamBoard"("code");

-- CreateIndex
CREATE INDEX "ExamBoard_authorityId_idx" ON "ExamBoard"("authorityId");

-- CreateIndex
CREATE INDEX "Book_className_subject_isCurrent_idx" ON "Book"("className", "subject", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "Book_authorityId_className_subject_edition_key" ON "Book"("authorityId", "className", "subject", "edition");

-- CreateIndex
CREATE UNIQUE INDEX "BookUnit_bookId_number_key" ON "BookUnit"("bookId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "BookTopic_unitId_code_key" ON "BookTopic"("unitId", "code");

-- CreateIndex
CREATE INDEX "BankQuestion_bookId_type_status_idx" ON "BankQuestion"("bookId", "type", "status");

-- CreateIndex
CREATE INDEX "BankQuestion_unitId_idx" ON "BankQuestion"("unitId");

-- CreateIndex
CREATE INDEX "BankQuestion_topicId_idx" ON "BankQuestion"("topicId");

-- CreateIndex
CREATE INDEX "BoardScheme_bookId_session_idx" ON "BoardScheme"("bookId", "session");

-- CreateIndex
CREATE INDEX "SavedPaper_academyId_idx" ON "SavedPaper"("academyId");

-- CreateIndex
CREATE INDEX "SavedPaper_createdById_idx" ON "SavedPaper"("createdById");

-- AddForeignKey
ALTER TABLE "ExamBoard" ADD CONSTRAINT "ExamBoard_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "TextbookAuthority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "TextbookAuthority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookUnit" ADD CONSTRAINT "BookUnit_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookTopic" ADD CONSTRAINT "BookTopic_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "BookUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "BookUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "BookTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardScheme" ADD CONSTRAINT "BoardScheme_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardScheme" ADD CONSTRAINT "BoardScheme_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPaper" ADD CONSTRAINT "SavedPaper_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPaper" ADD CONSTRAINT "SavedPaper_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lock the new tables against direct Supabase REST (anon/authenticated) access.
-- The app talks to Postgres through Prisma as the table owner, which bypasses RLS.
ALTER TABLE "TextbookAuthority" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExamBoard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Book" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookUnit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoardScheme" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedPaper" ENABLE ROW LEVEL SECURITY;

-- Reference data: Punjab textbook authority and its nine examining boards.
INSERT INTO "TextbookAuthority" ("id", "code", "name", "province") VALUES
  ('auth_pecta', 'PECTA', 'Punjab Education Curriculum, Training and Assessment Authority', 'Punjab');

INSERT INTO "ExamBoard" ("id", "code", "name", "province", "authorityId") VALUES
  ('board_bise_lhr', 'BISE-LHR', 'BISE Lahore', 'Punjab', 'auth_pecta'),
  ('board_bise_rwp', 'BISE-RWP', 'BISE Rawalpindi', 'Punjab', 'auth_pecta'),
  ('board_bise_fsd', 'BISE-FSD', 'BISE Faisalabad', 'Punjab', 'auth_pecta'),
  ('board_bise_grw', 'BISE-GRW', 'BISE Gujranwala', 'Punjab', 'auth_pecta'),
  ('board_bise_mtn', 'BISE-MTN', 'BISE Multan', 'Punjab', 'auth_pecta'),
  ('board_bise_swl', 'BISE-SWL', 'BISE Sahiwal', 'Punjab', 'auth_pecta'),
  ('board_bise_bwp', 'BISE-BWP', 'BISE Bahawalpur', 'Punjab', 'auth_pecta'),
  ('board_bise_sgd', 'BISE-SGD', 'BISE Sargodha', 'Punjab', 'auth_pecta'),
  ('board_bise_dgk', 'BISE-DGK', 'BISE Dera Ghazi Khan', 'Punjab', 'auth_pecta');