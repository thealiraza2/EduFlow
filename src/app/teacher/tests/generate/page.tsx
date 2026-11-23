import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { AITestPaperGenerator } from "@/components/teacher/AITestPaperGenerator";
import { ArrowLeft, Sparkles } from "@/components/icons";
import { ButtonLink, EmptyState, PageHeader } from "@/components/dashboard/kit";

export default async function TeacherGenerateTestPage() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  // Find teacher profile
  let teacher = await db.teacher.findFirst({
    where: {
      userId: user.id,
      ...(user.academyId ? { academyId: user.academyId } : {}),
    },
    include: {
      batches: {
        include: { class: true },
      },
    },
  });

  // Teacher batches or timetable slot batches or academy batches fallback
  let batches = teacher ? teacher.batches : [];
  if (teacher && batches.length === 0) {
    batches = await db.batch.findMany({
      where: {
        OR: [
          { timetableSlots: { some: { teacherId: teacher.id } } },
          { academyId: teacher.academyId },
        ],
      },
      include: { class: true },
    });
  }

  // Admin fallback
  if (!teacher && (user.role === Role.ADMIN || (user.role as string) === "SUPER_ADMIN")) {
    batches = await db.batch.findMany({
      where: user.academyId ? { academyId: user.academyId } : {},
      include: { class: true },
    });
  }

  // Load Boards with subjects, chapters, and schemes
  const boards = await db.board.findMany({
    include: {
      subjects: {
        include: {
          chapters: { orderBy: { number: "asc" } },
          schemes: true,
        },
        orderBy: [{ className: "asc" }, { name: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="Tests"
          title="Paper generator"
          description="Draft exam papers that follow the official board paper schemes."
          actions={
            <ButtonLink href="/teacher/tests" variant="secondary" icon={ArrowLeft}>
              Back to tests
            </ButtonLink>
          }
        />

        {batches.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No batches assigned yet"
            body="Ask your school admin to assign batches to your teacher profile."
          />
        ) : (
          <AITestPaperGenerator
            batches={batches}
            boards={boards as any}
            teacherSubjects={teacher?.subjects || []}
          />
        )}
      </div>
    </div>
  );
}
