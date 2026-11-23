import { requireSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ConsolePageHeader } from "@/components/superadmin/ConsoleUI";
import { InboxList } from "@/components/superadmin/InboxList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox | EduFlow Platform" };

export default async function InboxPage() {
  await requireSuperAdmin();
  const submissions = await db.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, contact: true, message: true, createdAt: true },
  });

  return (
    <div className="min-h-screen bg-canvas">
      <ConsolePageHeader
        title="Inbox"
        description={`Messages sent from the website contact form · ${submissions.length} total`}
      />
      <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-8 sm:py-8">
        <InboxList items={submissions.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))} />
      </div>
    </div>
  );
}
