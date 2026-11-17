import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <AdminNav academySlug={admin.academySlug} role={admin.role} />
      <main className="flex-1 min-w-0 py-8 px-4 sm:px-6 lg:px-8 bg-[#F4F6F9]">
        {children}
      </main>
    </div>
  );
}
