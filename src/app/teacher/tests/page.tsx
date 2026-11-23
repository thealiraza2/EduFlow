import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { CreateTestModal } from "@/components/teacher/CreateTestModal";
import { TeacherMarksEntry } from "@/components/teacher/TeacherMarksEntry";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ButtonLink, EmptyState, PageHeader, Panel, StatusPill } from "@/components/dashboard/kit";

export default async function TeacherTestsPage({
  searchParams,
}: {
  searchParams: { testId?: string };
}) {
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
      timetableSlots: {
        include: {
          batch: {
            include: { class: true },
          },
        },
      },
    },
  });

  // Extract all batches associated with teacher (assigned batches + timetable slots)
  let batches: any[] = [];
  if (teacher) {
    const batchMap = new Map();
    teacher.batches.forEach((b) => batchMap.set(b.id, b));
    teacher.timetableSlots?.forEach((slot) => {
      if (slot.batch) batchMap.set(slot.batch.id, slot.batch);
    });
    batches = Array.from(batchMap.values());
  }

  // Fallback to all batches in tenant academy if teacher has no explicit assignments or user is Admin
  if (batches.length === 0) {
    batches = await db.batch.findMany({
      where: user.academyId ? { academyId: user.academyId } : {},
      include: { class: true },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
    });
  }

  const batchIds = batches.map((b) => b.id);

  // Load tests for these batches
  const tests = await db.test.findMany({
    where: {
      batchId: { in: batchIds },
      ...(user.academyId ? { academyId: user.academyId } : {}),
    },
    include: {
      batch: {
        include: { class: true },
      },
      results: {
        include: { student: true },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  // If a specific test is selected, load its active enrolled students
  let selectedTest = null;
  let activeStudents: any[] = [];

  if (searchParams.testId) {
    selectedTest = tests.find((t) => t.id === searchParams.testId) || null;
    if (selectedTest) {
      const enrollments = await db.enrollment.findMany({
        where: {
          batchId: selectedTest.batchId,
          ...(user.academyId ? { academyId: user.academyId } : {}),
          status: "ACTIVE",
          student: { status: "ACTIVE" },
        },
        include: { student: true },
        orderBy: { student: { admissionNo: "asc" } },
      });
      activeStudents = enrollments.map((e) => e.student);
    }
  }

  return (
    <div>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tests"
          title={selectedTest ? selectedTest.title : "Tests & marks"}
          description={
            selectedTest
              ? `${selectedTest.batch.class.name} ${selectedTest.batch.name}, ${selectedTest.subject}, out of ${selectedTest.totalMarks}`
              : "Create tests and enter marks. Marks stay in draft until the admin publishes them."
          }
          actions={
            selectedTest ? (
              <ButtonLink href="/teacher/tests" variant="secondary" icon={ArrowLeft}>
                All tests
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/teacher/papers/new" variant="secondary" icon={Sparkles}>
                  Paper generator
                </ButtonLink>
                <CreateTestModal batches={batches} />
              </>
            )
          }
        />

        {selectedTest ? (
          <TeacherMarksEntry
            test={{
              id: selectedTest.id,
              title: selectedTest.title,
              subject: selectedTest.subject,
              totalMarks: selectedTest.totalMarks,
              date: selectedTest.date.toISOString().split("T")[0],
              status: selectedTest.status as "DRAFT" | "PUBLISHED",
              batch: selectedTest.batch,
              results: selectedTest.results.map((r) => ({
                studentId: r.studentId,
                obtainedMarks: r.obtainedMarks,
                remarks: r.remarks,
              })),
            }}
            students={activeStudents}
            userRole={user.role as "TEACHER" | "ADMIN"}
          />
        ) : (
          <div className="space-y-6">
            <Panel
              title="Your tests"
              description="Newest first"
              action={<StatusPill tone="plum">{tests.length} {tests.length === 1 ? "test" : "tests"}</StatusPill>}
              flush
            >
              {tests.length === 0 ? (
                <EmptyState
                  icon={FileSpreadsheet}
                  title="No tests yet"
                  body="Create a test to start entering marks for a batch."
                  className="border-0 shadow-none"
                />
              ) : (
                <ul className="divide-y divide-line">
                  {tests.map((test) => (
                    <li
                      key={test.id}
                      className="flex flex-col justify-between gap-3 px-4 py-4 transition-colors hover:bg-canvas sm:flex-row sm:items-center sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold text-ink">{test.title}</span>
                          <StatusPill tone={test.status === "PUBLISHED" ? "success" : "warning"}>
                            {test.status === "PUBLISHED" ? "Published" : "Draft"}
                          </StatusPill>
                        </div>
                        <p className="mt-1 text-[13px] text-ink-3">
                          {test.batch.class.name} {test.batch.name}, {test.subject}, out of {test.totalMarks}
                          <span className="ml-2 font-mono text-[12px]">{test.date.toISOString().split("T")[0]}</span>
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild className="shrink-0 self-start sm:self-auto">
                        <Link href={`/teacher/tests?testId=${test.id}`}>
                          {test.status === "PUBLISHED" ? "View results" : "Enter marks"}
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
