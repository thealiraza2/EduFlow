-- AlterTable
ALTER TABLE "PaperScheme" ADD COLUMN     "notes" TEXT,
ALTER COLUMN "timeMinutes" DROP NOT NULL;
