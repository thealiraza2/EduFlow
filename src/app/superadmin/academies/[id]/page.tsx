import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ConsolePageHeader } from "@/components/superadmin/ConsoleUI";
import { AcademyManagePanel } from "@/components/superadmin/AcademyManagePanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage academy | EduFlow Platform" };

export default async function ManageAcademyPage({ params }: { params: { id: string } }) {
  await requireSuperAdmin();

  const academy = await db.academy.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { students: true, teachers: true, classes: true, feeInvoices: true } },
      users: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, email: true, phone: true, role: true, mustChangePassword: true, createdAt: true },
      },
    },
  });
  if (!academy) notFound();

  return (
    <div className="min-h-screen bg-canvas">
      <ConsolePageHeader
        title={academy.name}
        description={
          <>
            <span className="font-mono">{academy.slug}.eduflow.app</span> · joined{" "}
            {academy.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </>
        }
        back={{ href: "/superadmin", label: "All academies" }}
      />
      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-8 sm:py-8">
        <AcademyManagePanel
          academy={{
            id: academy.id,
            name: academy.name,
            slug: academy.slug,
            plan: academy.plan,
            status: academy.status,
            trialEndsAt: academy.trialEndsAt ? academy.trialEndsAt.toISOString() : null,
            counts: academy._count,
          }}
          users={academy.users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
