import { requireSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { SuperAdminManager } from "@/components/superadmin/SuperAdminManager";
import { Role } from "@prisma/client";
import { ShieldCheck, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export default async function SuperAdminDashboardPage() {
  const superAdmin = await requireSuperAdmin();

  const academies = await db.academy.findMany({
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
        },
      },
      users: {
        where: { role: Role.ADMIN },
        take: 1,
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAcademies = academies.length;
  const activeAcademies = academies.filter((a) => a.status === "ACTIVE").length;
  const suspendedAcademies = academies.filter((a) => a.status === "SUSPENDED").length;
  const proCount = academies.filter((a) => a.plan === "PRO").length;
  const freeCount = academies.filter((a) => a.plan === "FREE").length;
  const totalStudents = academies.reduce((sum, a) => sum + a._count.students, 0);

  // Platform Subscription Revenue (PRO plan = PKR 15,000 / month = 1,500,000 paisa)
  const PRO_MONTHLY_FEE_PAISA = 1500000;
  const monthlyRevenueMinor = proCount * PRO_MONTHLY_FEE_PAISA;

  const formattedAcademies = academies.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    subdomain: a.subdomain,
    plan: a.plan,
    status: a.status,
    trialEndsAt: a.trialEndsAt ? a.trialEndsAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    studentsCount: a._count.students,
    teachersCount: a._count.teachers,
    adminEmail: a.users[0]?.email || null,
    adminName: a.users[0]?.name || null,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Superadmin Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Platform Administration
              </h1>
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-mono text-xs">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-purple-600" />
                Super Admin
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Logged in as <strong>{superAdmin.email}</strong> • Multi-branch SaaS control center
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="outline" size="sm" type="submit" className="text-xs text-slate-600">
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </form>
        </div>

        {/* Dashboard Manager */}
        <SuperAdminManager
          initialAcademies={formattedAcademies}
          stats={{
            totalAcademies,
            activeAcademies,
            suspendedAcademies,
            proCount,
            freeCount,
            totalStudents,
            monthlyRevenueMinor,
          }}
        />
      </div>
    </div>
  );
}
