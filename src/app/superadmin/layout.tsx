import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";
import { requireSuperAdmin } from "@/lib/permissions";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const superAdmin = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <SuperAdminSidebar user={superAdmin} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
