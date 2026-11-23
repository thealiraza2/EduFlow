import { requireSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ConsolePageHeader } from "@/components/superadmin/ConsoleUI";
import { AnnouncementComposer } from "@/components/superadmin/AnnouncementComposer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Announcements | EduFlow Platform" };

export default async function AnnouncementsPage() {
  await requireSuperAdmin();
  const now = new Date();
  const [all, active, trial, recent] = await Promise.all([
    db.academy.count(),
    db.academy.count({ where: { status: "ACTIVE" } }),
    db.academy.count({ where: { status: "ACTIVE", trialEndsAt: { gt: now } } }),
    db.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { title: true, content: true, audience: true, createdAt: true, academy: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-canvas">
      <ConsolePageHeader
        title="Announcements"
        description="Post a notice to every academy's dashboard at once — maintenance, new features or fee-season reminders."
      />
      <div className="mx-auto max-w-[1000px] space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <AnnouncementComposer counts={{ all, active, trial }} />
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-1 sm:p-6">
          <h2 className="text-[17px] font-bold text-ink">Recent announcements</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-[14px] text-ink-2">Nothing posted yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((a, idx) => (
                <li key={idx} className="py-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="text-[15px] font-semibold text-ink">{a.title}</p>
                    <p className="text-[12.5px] text-ink-3">
                      {a.academy.name} · {a.audience.toLowerCase()} ·{" "}
                      {a.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[14px] text-ink-2">{a.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
