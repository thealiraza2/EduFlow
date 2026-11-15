import { ParentNav } from "@/components/parent/ParentNav";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole([Role.PARENT, Role.ADMIN]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ParentNav user={user} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
