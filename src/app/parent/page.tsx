import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { getParentDashboardData } from "@/lib/parent";
import { ParentChildCard } from "@/components/parent/ParentChildCard";
import { ParentMessagesList } from "@/components/parent/ParentMessagesList";
import { AnnouncementsFeed } from "@/components/common/AnnouncementsFeed";
import { User } from "@/components/icons";
import { PageHeader, StatusPill } from "@/components/dashboard/kit";

export default async function ParentPortalDashboardPage() {
  const user = await requireRole([Role.PARENT, Role.ADMIN]);

  const [dashboardData, announcements] = await Promise.all([
    getParentDashboardData(user.id, user.role as Role),
    db.announcement.findMany({
      where: {
        audience: { in: ["ALL", "PARENTS"] },
        ...(user.academyId ? { academyId: user.academyId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const serializedAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    audience: a.audience,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={`Welcome, ${dashboardData.parent.name.split(" ")[0]}`}
        description={`${dashboardData.children.length} ${dashboardData.children.length === 1 ? "child" : "children"} linked to your account. Attendance, fees and results update as the school records them.`}
        actions={<StatusPill tone="plum">Parent portal</StatusPill>}
      />
      {/* Academy Notices */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-1">
        <AnnouncementsFeed
          announcements={serializedAnnouncements}
          title="Academy Notices &amp; Circulars"
        />
      </div>

      {/* Children Cards */}
      {dashboardData.children.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center shadow-1">
          <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-ink">No student profiles linked</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            No active student accounts are linked to your guardian email. Contact academy administration to link your child&apos;s admission file.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dashboardData.children.map((childSummary) => (
            <div key={childSummary.student.id} className="overflow-hidden rounded-[22px] border border-line bg-surface p-1 shadow-1">
              <ParentChildCard child={childSummary} />
            </div>
          ))}
        </div>
      )}

      {/* Messages & Alerts Archive */}
      <div>
        <ParentMessagesList messages={dashboardData.messages} />
      </div>
    </div>
  );
}
