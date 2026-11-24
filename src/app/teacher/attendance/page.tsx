import { requireClassroomRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { TeacherAttendanceSheet } from "@/components/teacher/TeacherAttendanceSheet";
import { TeacherQRModal } from "@/components/teacher/TeacherQRModal";
import { CheckCircle2 } from "@/components/icons";
import { EmptyState, PageHeader } from "@/components/dashboard/kit";

export default async function TeacherAttendancePage() {
  const user = await requireClassroomRole();

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
    <div>
      <div className="space-y-6">
        <PageHeader
          eyebrow={<>Signed in as <strong className="font-semibold text-ink">{user.name}</strong></>}
          title="Attendance"
          description="Mark today's register for a batch. Parents of absent students are notified."
          actions={
            batches.length > 0 ? (
              <TeacherQRModal
                batches={batches.map((b) => ({
                  id: b.id,
                  name: b.name,
                  timing: b.timing,
                  class: {
                    name: b.class.name,
                    section: b.class.section,
                  },
                }))}
              />
            ) : undefined
          }
        />

        {batches.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No batches assigned"
            body="You don't have any active batches on your teacher account yet."
          />
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
