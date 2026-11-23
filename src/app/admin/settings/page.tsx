import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AcademySettingsForm } from "@/components/admin/AcademySettingsForm";
import { ArrowLeft, Users, GraduationCap, School, BookOpen } from "@/components/icons";
import { ButtonLink, PageHeader, StatCard, StatGrid } from "@/components/dashboard/kit";
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

  const isOnTrial = academy.trialEndsAt !== null && new Date(academy.trialEndsAt) > new Date();

  const formattedData = {
    name: academy.name,
    slug: academy.slug,
    subdomain: academy.subdomain,
    plan: isOnTrial ? "14-Day Free Trial (PRO)" : `${academy.plan} Tier`,
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
      <PageHeader
        eyebrow="Academy"
        title="Settings"
        description="Your school profile, admin contact details and academic session."
        actions={
          <ButtonLink href="/admin" variant="secondary" icon={ArrowLeft}>
            Back to overview
          </ButtonLink>
        }
      />

      <StatGrid>
        <StatCard label="Students enrolled" value={academy._count.students} icon={Users} tone="success" />
        <StatCard label="Teachers" value={academy._count.teachers} icon={GraduationCap} tone="plum" />
        <StatCard label="Classes" value={academy._count.classes} icon={School} tone="info" />
        <StatCard label="Batches" value={academy._count.batches} icon={BookOpen} tone="warning" />
      </StatGrid>

      {/* Settings Form */}
      <AcademySettingsForm initialData={formattedData} />
    </div>
  );
}
