import { requireSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { SuperAdminManager } from "@/components/superadmin/SuperAdminManager";
import { Role, AcademyPlan, AcademyStatus } from "@prisma/client";

export default async function SuperAdminDashboardPage() {
  const superAdmin = await requireSuperAdmin();

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [academies, totalStudents, totalTeachers] = await Promise.all([
    db.academy.findMany({
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
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.student.count(),
    db.teacher.count(),
  ]);

  const totalAcademies = academies.length;
  const activeAcademies = academies.filter((a) => a.status === "ACTIVE").length;
  const suspendedAcademies = academies.filter((a) => a.status === "SUSPENDED").length;

  // Active 14-day trials
  const activeTrials = academies.filter(
    (a) => a.trialEndsAt !== null && new Date(a.trialEndsAt) > now
  );
  const activeTrialsCount = activeTrials.length;

  // Trials expiring within 3 days
  const trialsExpiringSoonList = academies.filter(
    (a) =>
      a.trialEndsAt !== null &&
      new Date(a.trialEndsAt) > now &&
      new Date(a.trialEndsAt) <= threeDaysFromNow
  );
  const trialsExpiringSoonCount = trialsExpiringSoonList.length;

  // Academies joined this calendar month
  const newThisMonthCount = academies.filter(
    (a) => new Date(a.createdAt) >= startOfCurrentMonth
  ).length;

  // Plan Distribution (Trial / Starter / Growth / Pro) - 0 shows as 0, never hidden
  let trialCount = 0;
  let starterCount = 0;
  let growthCount = 0;
  let proCount = 0;

  for (const a of academies) {
    const onTrial = a.trialEndsAt !== null && new Date(a.trialEndsAt) > now;
    if (onTrial) {
      trialCount++;
    } else if (a.plan === "STARTER") {
      starterCount++;
    } else if (a.plan === "GROWTH") {
      growthCount++;
    } else if (a.plan === "PRO") {
      proCount++;
    }
  }

  // MRR = sum of plan prices of ACTIVE PAYING academies only
  // Starter 2,500 / Growth 5,000 / Pro 9,000 per month; trials = PKR 0; suspended = PKR 0
  function getAcademyMonthlyFeeMinor(a: {
    plan: AcademyPlan;
    status: AcademyStatus;
    trialEndsAt: Date | null;
  }): number {
    if (a.status !== "ACTIVE") return 0;
    if (a.trialEndsAt !== null && new Date(a.trialEndsAt) > now) return 0;

    switch (a.plan) {
      case "STARTER":
        return 250000; // PKR 2,500 in paisa
      case "GROWTH":
        return 500000; // PKR 5,000 in paisa
      case "PRO":
        return 900000; // PKR 9,000 in paisa
      case "FREE":
      default:
        return 0;
    }
  }

  const monthlyRevenueMinor = academies.reduce(
    (sum, a) => sum + getAcademyMonthlyFeeMinor(a),
    0
  );

  // Revenue trend — MRR per month for the last 6 months from subscription/payment records
  // Show only months that exist, never invent past months
  const monthsMap = new Map<string, { label: string; mrrMinor: number; count: number }>();
  for (const a of academies) {
    const createdDate = new Date(a.createdAt);
    const key = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}`;
    const label = createdDate.toLocaleString("en-US", { month: "short", year: "numeric" });

    if (!monthsMap.has(key)) {
      monthsMap.set(key, { label, mrrMinor: 0, count: 0 });
    }
    const entry = monthsMap.get(key)!;
    entry.count++;
    entry.mrrMinor += getAcademyMonthlyFeeMinor(a);
  }

  const revenueTrend = Array.from(monthsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => ({
      key,
      label: val.label,
      mrrMinor: val.mrrMinor,
      academyCount: val.count,
    }));

  // Format academies for the client table
  const formattedAcademies = academies.map((a) => {
    const onTrial = a.trialEndsAt !== null && new Date(a.trialEndsAt) > now;
    const feeMinor = getAcademyMonthlyFeeMinor(a);

    let mrrLabel = "PKR 0";
    if (a.status === "SUSPENDED") {
      mrrLabel = "PKR 0 (Suspended)";
    } else if (onTrial) {
      mrrLabel = "PKR 0 (Trial)";
    } else if (feeMinor > 0) {
      mrrLabel = `PKR ${(feeMinor / 100).toLocaleString()}`;
    }

    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      subdomain: a.subdomain,
      plan: a.plan,
      status: a.status,
      isOnTrial: onTrial,
      trialEndsAt: a.trialEndsAt ? a.trialEndsAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      studentsCount: a._count.students,
      teachersCount: a._count.teachers,
      adminEmail: a.users[0]?.email || null,
      adminName: a.users[0]?.name || null,
      adminPhone: a.users[0]?.phone || null,
      mrrContributionMinor: feeMinor,
      mrrLabel,
    };
  });

  // Top academies by students (Top 5)
  const topAcademiesByStudents = [...formattedAcademies]
    .sort((a, b) => b.studentsCount - a.studentsCount)
    .slice(0, 5);

  // Trials expiring soon list
  const trialsExpiringSoon = formattedAcademies.filter(
    (a) =>
      a.trialEndsAt &&
      new Date(a.trialEndsAt) > now &&
      new Date(a.trialEndsAt) <= threeDaysFromNow
  );

  const currentMonthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      <SuperAdminManager
        stats={{
          totalAcademies,
          activeAcademies,
          onTrialAcademies: activeTrialsCount,
          suspendedAcademies,
          totalStudents,
          totalTeachers,
          monthlyRevenueMinor,
          activeTrialsCount,
          trialsExpiringSoonCount,
          newThisMonthCount,
          currentMonthName,
          planDistribution: {
            trial: trialCount,
            starter: starterCount,
            growth: growthCount,
            pro: proCount,
          },
        }}
        revenueTrend={revenueTrend}
        academies={formattedAcademies}
        trialsExpiringSoon={trialsExpiringSoon}
        topAcademiesByStudents={topAcademiesByStudents}
        superAdminEmail={superAdmin.email || "superadmin@eduflow.test"}
      />
    </div>
  );
}
