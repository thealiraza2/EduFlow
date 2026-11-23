import Link from "next/link";
import { ShieldCheck } from "@/components/icons";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { exitAcademyViewAction } from "@/lib/actions/superadmin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  // Super admins manage whichever academy they opened from the platform console.
  const tenant = isSuperAdmin ? await requireTenant().catch(() => null) : null;

  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <AdminNav academySlug={tenant?.academy.slug ?? admin.academySlug} role={admin.role} />
      <main className="min-w-0 flex-1">
        {isSuperAdmin && (
          <div className="flex flex-col gap-2 border-b border-primary/20 bg-primary-tint px-4 py-2.5 text-[14px] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p className="flex min-w-0 items-center gap-2 text-ink">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              <span className="truncate">
                Super admin view ·{" "}
                <strong className="font-semibold">{tenant?.academy.name ?? "No academy selected"}</strong>
                {tenant && <span className="text-ink-3"> ({tenant.academy.slug})</span>}
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/superadmin"
                className="rounded-full border border-primary/30 bg-surface px-3 py-1 text-[13px] font-semibold text-primary hover:bg-canvas"
              >
                Switch academy
              </Link>
              <form action={exitAcademyViewAction}>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-3 py-1 text-[13px] font-semibold text-white hover:bg-primary-hover"
                >
                  Back to platform
                </button>
              </form>
            </div>
          </div>
        )}
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
