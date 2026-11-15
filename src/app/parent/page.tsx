import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { getParentDashboardData } from "@/lib/parent";
import { ParentChildCard } from "@/components/parent/ParentChildCard";
import { ParentMessagesList } from "@/components/parent/ParentMessagesList";
import { AnnouncementsFeed } from "@/components/common/AnnouncementsFeed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, ShieldCheck, HeartHandshake } from "lucide-react";

export default async function ParentPortalDashboardPage() {
  const user = await requireRole([Role.PARENT, Role.ADMIN]);

  const dashboardData = await getParentDashboardData(
    user.id,
    user.role as Role
  );

  const announcements = await db.announcement.findMany({
    where: {
      audience: { in: ["ALL", "PARENTS"] },
      ...(user.academyId ? { academyId: user.academyId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const serializedAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    audience: a.audience,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Parent Portal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-slate-900">Parent Portal</h1>
              <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-emerald-50">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Verified Guardian Access
              </Badge>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Welcome, <strong>{dashboardData.parent.name}</strong> ({dashboardData.parent.email})
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs px-3 py-1 font-mono">
              {dashboardData.children.length} Linked {dashboardData.children.length === 1 ? "Child" : "Children"}
            </Badge>
          </div>
        </div>

        {/* Academy Notices for Parents */}
        <AnnouncementsFeed
          announcements={serializedAnnouncements}
          title="Academy Notices & Circulars"
        />

        {/* Children List */}
        {dashboardData.children.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-3">
              <User className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">No student profiles linked</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No active student accounts are linked to your guardian email. Contact academy administration to link your child's admission file.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {dashboardData.children.map((childSummary) => (
              <ParentChildCard key={childSummary.student.id} child={childSummary} />
            ))}
          </div>
        )}

        {/* Messages & Alerts Archive */}
        <ParentMessagesList messages={dashboardData.messages} />
      </div>
    </div>
  );
}
