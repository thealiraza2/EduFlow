import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { TeacherAttendanceSheet } from "@/components/teacher/TeacherAttendanceSheet";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function TeacherAttendancePage() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  // Find the teacher profile
  let teacher = await db.teacher.findFirst({
    where: {
      userId: user.id,
      ...(user.academyId ? { academyId: user.academyId } : {}),
    },
    include: {
      batches: {
        include: { class: true },
        orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
      },
    },
  });

  // If viewing as admin without direct teacher profile, fetch all batches
  let batches = teacher ? teacher.batches : [];
  if (!teacher && (user.role === Role.ADMIN || (user.role as string) === "SUPER_ADMIN")) {
    batches = await db.batch.findMany({
      where: user.academyId ? { academyId: user.academyId } : {},
      include: { class: true },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Link href="/teacher">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
                <CheckCircle2 className="h-6 w-6 mr-2 text-emerald-600" />
                Batch Attendance
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark daily batch attendance and notify parents of absent students.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-white border px-3 py-1.5 rounded-md">
            Logged in as <strong>{user.name}</strong> ({user.role})
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-slate-500">
            <p className="text-base font-medium text-slate-700">No batches assigned</p>
            <p className="text-xs text-slate-400 mt-1">
              You do not have any active batches assigned to your teacher account yet.
            </p>
          </div>
        ) : (
          <TeacherAttendanceSheet
            batches={batches.map((b) => ({
              id: b.id,
              name: b.name,
              timing: b.timing,
              class: {
                name: b.class.name,
                section: b.class.section,
              },
            }))}
            userRole={user.role as "TEACHER" | "ADMIN"}
          />
        )}
      </div>
    </div>
  );
}
