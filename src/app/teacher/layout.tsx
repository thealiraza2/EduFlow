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
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <TeacherNav user={user} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
