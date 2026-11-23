import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { CreateTestModal } from "@/components/teacher/CreateTestModal";
import { TeacherMarksEntry } from "@/components/teacher/TeacherMarksEntry";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, PlusCircle, CheckCircle2, Clock, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href={selectedTest ? "/teacher/tests" : "/teacher"}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                {selectedTest ? "Back to Tests" : "Back to Dashboard"}
              </Link>
            </Button>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 flex items-center">
                <FileSpreadsheet className="h-6 w-6 mr-2 text-blue-600 shrink-0" />
                Assessment Tests & Marks
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Create tests and enter student marks. Marks remain DRAFT until published by admin.
              </p>
            </div>
          </div>

          {!selectedTest && (
            <div className="flex items-center gap-2">
              <Link href="/teacher/tests/generate">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-1 flex items-center"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  AI Test Generator
                </Button>
              </Link>
              <CreateTestModal batches={batches} />
            </div>
          )}
        </div>

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
            <Card className="shadow-1">
              <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Assigned Tests
                  </CardTitle>
                </div>
                <span className="text-xs font-mono text-slate-500">{tests.length} Total Tests</span>
              </CardHeader>

              <CardContent className="p-0">
                {tests.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">No tests created yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tests.map((test) => (
                      <div
                        key={test.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900 text-sm">{test.title}</span>
                            <Badge
                              variant={test.status === "PUBLISHED" ? "default" : "secondary"}
                              className={`text-xs uppercase font-semibold py-0 px-1.5 ${
                                test.status === "PUBLISHED" ? "bg-emerald-600 text-white" : ""
                              }`}
                            >
                              {test.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Batch: <strong>{test.batch.class.name} {test.batch.name}</strong> • Subject: <strong>{test.subject}</strong> • Max: <strong>{test.totalMarks}</strong> • Date: {test.date.toISOString().split("T")[0]}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link href={`/teacher/tests?testId=${test.id}`}>
                            <Button size="sm" variant="outline" className="text-xs">
                              {test.status === "PUBLISHED" ? "View Results" : "Enter / Edit Marks"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
