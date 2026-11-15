import { TeacherNav } from "@/components/teacher/TeacherNav";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TeacherNav user={user} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
