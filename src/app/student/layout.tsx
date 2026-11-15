import { StudentNav } from "@/components/student/StudentNav";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <StudentNav user={user} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
