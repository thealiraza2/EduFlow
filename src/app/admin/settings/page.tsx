import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AcademySettingsForm } from "@/components/admin/AcademySettingsForm";
import Link from "next/link";
import { ArrowLeft, Settings, Users, GraduationCap, School, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Academy Settings | EduFlow Admin",
};

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const tenant = await requireTenant();

  const academy = await db.academy.findUnique({
    where: { id: tenant.academyId },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          classes: true,
          batches: true,
        },
      },
    },
  });

  if (!academy) {
    notFound();
  }

  const user = await db.user.findUnique({
    where: { id: admin.id },
    select: {
      email: true,
      phone: true,
      name: true,
    },
  });

  const formattedData = {
    name: academy.name,
    slug: academy.slug,
    subdomain: academy.subdomain,
    plan: academy.plan,
    status: academy.status,
    phone: user?.phone || null,
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    adminEmail: user?.email || admin.email || "",
    createdAt: academy.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
              <Settings className="h-6 w-6 mr-2 text-slate-700" />
              Academy Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure institution profile, administrator contact numbers, and academic sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Live System Capacity Summary (100% Real DB Queries) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-slate-500">
            <span className="text-xs font-medium">Students Enrolled</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="py-0 px-4 pb-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {academy._count.students}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-slate-500">
            <span className="text-xs font-medium">Faculty Members</span>
            <GraduationCap className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="py-0 px-4 pb-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {academy._count.teachers}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-slate-500">
            <span className="text-xs font-medium">Academic Classes</span>
            <School className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="py-0 px-4 pb-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {academy._count.classes}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-slate-500">
            <span className="text-xs font-medium">Active Batches</span>
            <BookOpen className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="py-0 px-4 pb-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {academy._count.batches}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Form */}
      <AcademySettingsForm initialData={formattedData} />
    </div>
  );
}
