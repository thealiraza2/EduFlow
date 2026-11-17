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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC]">
      <StudentNav user={user} />
      <main className="flex-1 min-w-0 py-8 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        {children}
      </main>
    </div>
  );
}
