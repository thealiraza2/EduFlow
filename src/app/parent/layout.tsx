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
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <ParentNav user={user} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
