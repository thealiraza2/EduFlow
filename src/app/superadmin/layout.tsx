import { SuperAdminNav } from "@/components/superadmin/SuperAdminNav";
import { requireSuperAdmin } from "@/lib/permissions";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const superAdmin = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SuperAdminNav user={superAdmin} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
