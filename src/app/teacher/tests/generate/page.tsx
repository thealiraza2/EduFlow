import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { AITestPaperGenerator } from "@/components/teacher/AITestPaperGenerator";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Admin fallback
  let batches = teacher ? teacher.batches : [];
  if (!teacher && (user.role === Role.ADMIN || (user.role as string) === "SUPER_ADMIN")) {
    batches = await db.batch.findMany({
      where: user.academyId ? { academyId: user.academyId } : {},
      include: { class: true },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Link href="/teacher/tests">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-indigo-600" />
                AI Test Paper Generator
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate high quality MCQs and short answer questions aligned with Pakistani curricula.
              </p>
            </div>
          </div>
        </div>

        {/* Generator component */}
        {batches.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border">
            <p className="text-slate-600 font-medium">No batches assigned yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Please contact the academy administrator to assign batches to your teacher profile.
            </p>
          </div>
        ) : (
          <AITestPaperGenerator
            batches={batches}
            teacherSubjects={teacher?.subjects || []}
          />
        )}
      </div>
    </div>
  );
}
