import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { getParentDashboardData } from "@/lib/parent";
import { ParentChildCard } from "@/components/parent/ParentChildCard";
import { ParentMessagesList } from "@/components/parent/ParentMessagesList";
import { AnnouncementsFeed } from "@/components/common/AnnouncementsFeed";
import { User } from "@/components/icons";

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
    <div className="space-y-7 max-w-5xl mx-auto w-full">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 border-t-4 border-t-primary shadow-1 card-lift relative overflow-hidden">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
              Welcome, {dashboardData.parent.name}
            </h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-xs">
              Guardian Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{dashboardData.parent.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full font-semibold border border-slate-200">
            {dashboardData.children.length} Linked{" "}
            {dashboardData.children.length === 1 ? "Child" : "Children"}
          </span>
        </div>
      </div>

      {/* Academy Notices */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 p-0 overflow-hidden card-lift">
        <AnnouncementsFeed
          announcements={serializedAnnouncements}
          title="Academy Notices &amp; Circulars"
        />
      </div>

      {/* Children Cards */}
      {dashboardData.children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 text-center py-12 px-6 card-lift">
          <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-ink">No student profiles linked</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            No active student accounts are linked to your guardian email. Contact academy administration to link your child&apos;s admission file.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dashboardData.children.map((childSummary) => (
            <div key={childSummary.student.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-1 overflow-hidden card-lift p-1">
              <ParentChildCard child={childSummary} />
            </div>
          ))}
        </div>
      )}

      {/* Messages & Alerts Archive */}
      <div className="card-lift">
        <ParentMessagesList messages={dashboardData.messages} />
      </div>
    </div>
  );
}
