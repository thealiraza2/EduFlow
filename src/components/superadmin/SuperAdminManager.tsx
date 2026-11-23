"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { formatPKR } from "@/lib/money";
import { toggleAcademyStatusAction, updateAcademyPlanAction } from "@/lib/actions/superadmin";
import { AcademyPlan, AcademyStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountUp } from "@/components/common/CountUp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
  CalendarPlus,
  Search,
  Power,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck,
  Award,
  ChevronRight,
} from "lucide-react";

export interface FormattedAcademy {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  plan: AcademyPlan;
  status: AcademyStatus;
  isOnTrial: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  studentsCount: number;
  teachersCount: number;
  adminEmail: string | null;
  adminName: string | null;
  adminPhone: string | null;
  mrrContributionMinor: number;
  mrrLabel: string;
}

export interface SuperAdminStats {
  totalAcademies: number;
  activeAcademies: number;
  onTrialAcademies: number;
  suspendedAcademies: number;
  totalStudents: number;
  totalTeachers: number;
  monthlyRevenueMinor: number;
  activeTrialsCount: number;
  trialsExpiringSoonCount: number;
  newThisMonthCount: number;
  currentMonthName: string;
  planDistribution: {
    trial: number;
    starter: number;
    growth: number;
    pro: number;
  };
}

export interface RevenueTrendPoint {
  key: string;
  label: string;
  mrrMinor: number;
  academyCount: number;
}

interface Props {
  stats: SuperAdminStats;
  revenueTrend: RevenueTrendPoint[];
  academies: FormattedAcademy[];
  trialsExpiringSoon: FormattedAcademy[];
  topAcademiesByStudents: FormattedAcademy[];
  superAdminEmail: string;
}

export function SuperAdminManager({
  stats,
  revenueTrend,
  academies: initialAcademies,
  trialsExpiringSoon,
  topAcademiesByStudents,
  superAdminEmail,
}: Props) {
  const [academies, setAcademies] = useState<FormattedAcademy[]>(initialAcademies);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedAcademy, setSelectedAcademy] = useState<FormattedAcademy | null>(null);

  // Plan Switch Dialog State
  const [planChangeAcademy, setPlanChangeAcademy] = useState<FormattedAcademy | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState<AcademyPlan>(AcademyPlan.PRO);

  const handleToggleStatus = (academyId: string, currentStatus: AcademyStatus) => {
    const newStatus =
      currentStatus === AcademyStatus.ACTIVE
        ? AcademyStatus.SUSPENDED
        : AcademyStatus.ACTIVE;
    setActionId(academyId);

    startTransition(async () => {
      try {
        await toggleAcademyStatusAction(academyId, newStatus);
        setAcademies((prev) =>
          prev.map((a) => (a.id === academyId ? { ...a, status: newStatus } : a))
        );
      } finally {
        setActionId(null);
      }
    });
  };

  const handleConfirmPlanChange = () => {
    if (!planChangeAcademy) return;
    const academyId = planChangeAcademy.id;
    setActionId(academyId);

    startTransition(async () => {
      try {
        await updateAcademyPlanAction(academyId, selectedNewPlan);
        setAcademies((prev) =>
          prev.map((a) =>
            a.id === academyId ? { ...a, plan: selectedNewPlan } : a
          )
        );
        setPlanChangeAcademy(null);
      } finally {
        setActionId(null);
      }
    });
  };

  const filteredAcademies = academies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      (a.adminEmail && a.adminEmail.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      filterStatus === "ALL" || a.status === filterStatus;

    let matchesPlan = true;
    if (filterPlan === "TRIAL") {
      matchesPlan = a.isOnTrial;
    } else if (filterPlan === "STARTER") {
      matchesPlan = !a.isOnTrial && a.plan === "STARTER";
    } else if (filterPlan === "GROWTH") {
      matchesPlan = !a.isOnTrial && a.plan === "GROWTH";
    } else if (filterPlan === "PRO") {
      matchesPlan = !a.isOnTrial && a.plan === "PRO";
    }

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const newestTen = filteredAcademies;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* TOP ROW: 6 Stat Cards — Midnight SaaS Style with Card Lift and CountUp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Academies */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 p-5 card-lift">
          <div className="w-10 h-10 rounded-xl bg-primary-tint border border-primary/30 flex items-center justify-center mb-3 shadow-xs">
            <Building2 className="h-5 w-5 text-accent" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Academies</p>
          <div className="text-2xl sm:text-3xl font-semibold text-ink">
            <CountUp value={stats.totalAcademies} />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {stats.activeAcademies} active · {stats.onTrialAcademies} on trial · {stats.suspendedAcademies} suspended
          </p>
        </div>

        {/* Card 2: Total Students */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 p-5 card-lift">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/50 flex items-center justify-center mb-3 shadow-xs">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Students</p>
          <div className="text-2xl sm:text-3xl font-semibold text-ink">
            <CountUp value={stats.totalStudents} />
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all registered academies</p>
        </div>

        {/* Card 3: Total Teachers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 p-5 card-lift">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/50 flex items-center justify-center mb-3 shadow-xs">
            <GraduationCap className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Teachers</p>
          <div className="text-2xl sm:text-3xl font-semibold text-ink">
            <CountUp value={stats.totalTeachers} />
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all registered academies</p>
        </div>

        {/* Card 4: Platform MRR */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 p-5 card-lift">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/50 flex items-center justify-center mb-3 shadow-xs">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Platform MRR</p>
          <div className="text-2xl sm:text-3xl font-semibold text-emerald-600 font-mono">
            <CountUp value={stats.monthlyRevenueMinor / 100} prefix="PKR " />
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            Starter 2,500 · Growth 5,000 · Pro 9,000 / mo
          </p>
        </div>

        {/* Card 5: Active Trials */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 p-5 card-lift">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center mb-3 shadow-xs">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Active Trials</p>
          <div className="text-2xl sm:text-3xl font-semibold text-ink">
            <CountUp value={stats.activeTrialsCount} />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {stats.activeTrialsCount} on trial · {stats.trialsExpiringSoonCount} expiring soon
          </p>
        </div>

        {/* Card 6: New This Month */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 p-5 card-lift">
          <div className="w-10 h-10 rounded-xl bg-primary-tint border border-primary/30 flex items-center justify-center mb-3 shadow-xs">
            <CalendarPlus className="h-5 w-5 text-accent" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">New This Month</p>
          <div className="text-2xl sm:text-3xl font-semibold text-ink">
            <CountUp value={stats.newThisMonthCount} />
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            Joined in {stats.currentMonthName}
          </p>
        </div>
      </div>

      {/* CHARTS SECTION (Real data only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Trend */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-1 bg-white card-lift overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-emerald-600" />
                  Monthly Recurring Revenue (Last 6 Months)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Computed from real paying subscription records. Showing only months that exist.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-slate-500">
                Live Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {revenueTrend.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No billing history recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4 h-48 pt-6 px-2 border-b border-slate-100">
                  {revenueTrend.map((pt) => {
                    const maxVal = Math.max(...revenueTrend.map((p) => p.mrrMinor), 100000);
                    const heightPercent = Math.max(10, Math.round((pt.mrrMinor / maxVal) * 100));

                    return (
                      <div
                        key={pt.key}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >
                        <div className="text-xs font-mono font-semibold text-slate-700 mb-1 opacity-90 group-hover:opacity-100">
                          {formatPKR(pt.mrrMinor)}
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[64px] rounded-t-md transition-all ${
                            pt.mrrMinor > 0
                              ? "bg-emerald-600 group-hover:bg-emerald-500"
                              : "bg-slate-200 group-hover:bg-slate-300"
                          }`}
                        />
                        <div className="mt-2 text-xs font-semibold text-slate-600">
                          {pt.label}
                        </div>
                        <div className="text-xs text-slate-400">
                          {pt.academyCount} {pt.academyCount === 1 ? "academy" : "academies"}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center text-xs text-slate-400">
                  <Info className="h-3.5 w-3.5 mr-1.5 shrink-0 text-slate-400" />
                  <span>
                    Current month reflects active paying tenants. Academies on 14-day trial contribute PKR 0.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Plan Distribution */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-1 bg-white card-lift overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                  Subscription Plan Distribution
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Breakdown across Trial, Starter, Growth, and Pro tiers (0 shows as 0).
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-slate-500">
                {stats.totalAcademies} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                name: "Trial (14-Day Free Trial)",
                count: stats.planDistribution.trial,
                color: "bg-amber-500",
                badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
                price: "PKR 0 / mo",
              },
              {
                name: "Starter Plan",
                count: stats.planDistribution.starter,
                color: "bg-blue-500",
                badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
                price: "PKR 2,500 / mo",
              },
              {
                name: "Growth Plan",
                count: stats.planDistribution.growth,
                color: "bg-indigo-500",
                badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
                price: "PKR 5,000 / mo",
              },
              {
                name: "Pro Plan",
                count: stats.planDistribution.pro,
                color: "bg-purple-600",
                badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
                price: "PKR 9,000 / mo",
              },
            ].map((planItem) => {
              const pct =
                stats.totalAcademies > 0
                  ? Math.round((planItem.count / stats.totalAcademies) * 100)
                  : 0;

              return (
                <div key={planItem.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{planItem.name}</span>
                      <span className="text-xs text-slate-400 font-mono">({planItem.price})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs font-mono font-semibold ${planItem.badgeColor}`}>
                        {planItem.count} {planItem.count === 1 ? "academy" : "academies"}
                      </Badge>
                      <span className="text-xs font-mono text-slate-500 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${planItem.color} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* TABLES SECTION */}
      <div id="academies" className="space-y-6">
        {/* Table 1: Recent Academies (Newest 10) */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-1 bg-white card-lift overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-slate-700" />
                  Academies
                </CardTitle>
                <CardDescription className="text-xs">
                  Every academy on the platform. Open one to manage its trial, admins, passwords or to work inside it.
                </CardDescription>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/superadmin/academies/new"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New academy
                </Link>
                <div className="relative w-full sm:w-56">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Search name, slug, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="SUSPENDED">Suspended Only</option>
                </select>

                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="h-9 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="ALL">All Plans</option>
                  <option value="TRIAL">On 14-Day Trial</option>
                  <option value="STARTER">Starter Plan</option>
                  <option value="GROWTH">Growth Plan</option>
                  <option value="PRO">Pro Plan</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Academy / Domain</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Students</th>
                    <th className="py-3 px-4">Admin Contact</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4">MRR Contribution</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {newestTen.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No academies found matching your search.
                      </td>
                    </tr>
                  ) : (
                    newestTen.map((academy) => {
                      const isActing = isPending && actionId === academy.id;

                      return (
                        <tr key={academy.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 text-sm">{academy.name}</div>
                            <div className="font-mono text-xs text-blue-600 mt-0.5">
                              {academy.slug}.eduflow.app
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {academy.isOnTrial ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-semibold">
                                14-Day Free Trial ({academy.plan})
                              </Badge>
                            ) : (
                              <Badge
                                variant={academy.plan === "PRO" ? "default" : "secondary"}
                                className={`text-xs font-semibold ${
                                  academy.plan === "PRO"
                                    ? "bg-purple-600 text-white"
                                    : academy.plan === "GROWTH"
                                    ? "bg-indigo-600 text-white"
                                    : academy.plan === "STARTER"
                                    ? "bg-blue-600 text-white"
                                    : ""
                                }`}
                              >
                                {academy.plan}
                              </Badge>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <Badge
                              variant={academy.status === "ACTIVE" ? "default" : "destructive"}
                              className={`text-xs uppercase font-semibold ${
                                academy.status === "ACTIVE" ? "bg-emerald-600 text-white" : ""
                              }`}
                            >
                              {academy.status}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 font-mono font-medium text-slate-700">
                            {academy.studentsCount} Students
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{academy.adminName || "—"}</div>
                            <div className="text-xs text-slate-400 font-mono">{academy.adminEmail || "—"}</div>
                          </td>

                          <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                            {academy.createdAt.split("T")[0]}
                          </td>

                          <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                            {academy.mrrLabel}
                          </td>

                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {/* Manage: trial, admins, passwords, open as admin, delete */}
                            <Link
                              href={`/superadmin/academies/${academy.id}`}
                              className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-semibold text-white hover:bg-primary-hover"
                              title="Manage academy"
                            >
                              <Settings2 className="h-3 w-3 mr-1" />
                              Manage
                            </Link>

                            {/* Plan Switch Action */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isActing}
                              onClick={() => {
                                setPlanChangeAcademy(academy);
                                setSelectedNewPlan(academy.plan);
                              }}
                              className="h-7 text-xs px-2"
                              title="Change subscription plan"
                            >
                              Change Plan
                            </Button>

                            {/* Suspend / Activate Action */}
                            <Button
                              size="sm"
                              variant={academy.status === "ACTIVE" ? "destructive" : "default"}
                              disabled={isActing}
                              onClick={() => handleToggleStatus(academy.id, academy.status)}
                              className={`h-7 text-xs px-2.5 ${
                                academy.status === "SUSPENDED" ? "bg-emerald-600 hover:bg-emerald-700" : ""
                              }`}
                            >
                              {isActing ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : academy.status === "ACTIVE" ? (
                                <>
                                  <Power className="h-3 w-3 mr-1" />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Lower Row: Trials Expiring Soon & Top Academies by Students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 2: Trials Expiring Soon (3 days) */}
          <Card className="shadow-1 border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                    Trials Expiring Soon
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Tenants whose 14-day free trial ends within the next 3 days.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50">
                  {trialsExpiringSoon.length} Expiring
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {trialsExpiringSoon.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto opacity-80" />
                  <div className="text-sm font-semibold text-slate-800">No trials expiring soon.</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    All active trial academies currently have more than 3 days remaining before conversion.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Academy</th>
                        <th className="py-2.5 px-4">Admin</th>
                        <th className="py-2.5 px-4">Trial Ends At</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trialsExpiringSoon.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{a.name}</td>
                          <td className="py-2.5 px-4 text-slate-600">{a.adminEmail}</td>
                          <td className="py-2.5 px-4 font-mono text-amber-600">
                            {a.trialEndsAt ? a.trialEndsAt.split("T")[0] : "—"}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedAcademy(a)}
                              className="h-6 text-xs px-2"
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table 3: Top Academies by Students (Top 5) */}
          <Card className="shadow-1 border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center">
                    <Award className="h-4 w-4 mr-2 text-indigo-600" />
                    Top Academies by Students
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Highest student enrolment across all tenant academies.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs text-slate-500">
                  Top 5
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {topAcademiesByStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No academy enrolment data available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Rank</th>
                        <th className="py-2.5 px-4">Academy</th>
                        <th className="py-2.5 px-4 text-center">Students</th>
                        <th className="py-2.5 px-4 text-center">Teachers</th>
                        <th className="py-2.5 px-4">Plan</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topAcademiesByStudents.map((a, idx) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-semibold text-slate-500 font-mono">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900">{a.name}</div>
                            <div className="font-mono text-xs text-slate-400">{a.slug}</div>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-semibold text-indigo-600">
                            {a.studentsCount}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-700">
                            {a.teachersCount}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="text-xs font-semibold text-slate-600">
                              {a.isOnTrial ? `14-Day Free Trial (${a.plan})` : a.plan}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <Badge
                              className={`text-xs font-semibold ${
                                a.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-rose-100 text-rose-800 border-rose-300"
                              }`}
                            >
                              {a.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SECTION: Plans & Billing Reference Card (Anchor: #plans) */}
        <div id="plans" className="pt-2">
          <Card className="shadow-1 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                EduFlow Platform Subscription Plans & MRR Pricing Formula
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Official pricing matrix used to calculate platform recurring revenue. Trials and suspended tenants are excluded from MRR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/60 space-y-1.5">
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                    14-Day Free Trial
                  </div>
                  <div className="text-xl font-semibold font-mono text-slate-900">PKR 0</div>
                  <p className="text-xs text-slate-500">
                    Automatic 14-day evaluation period on signup. Zero MRR contribution.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/60 space-y-1.5">
                  <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                    Starter Plan
                  </div>
                  <div className="text-xl font-semibold font-mono text-slate-900">PKR 2,500 / mo</div>
                  <p className="text-xs text-slate-500">
                    For tuition centres & small academies. Up to 100 active students.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-200/60 space-y-1.5">
                  <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">
                    Growth Plan
                  </div>
                  <div className="text-xl font-semibold font-mono text-slate-900">PKR 5,000 / mo</div>
                  <p className="text-xs text-slate-500">
                    For growing schools & coaching institutes. 101 – 500 active students.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200/60 space-y-1.5">
                  <div className="text-xs font-semibold text-purple-800 uppercase tracking-wide">
                    Pro Plan
                  </div>
                  <div className="text-xl font-semibold font-mono text-slate-900">PKR 9,000 / mo</div>
                  <p className="text-xs text-slate-500">
                    For large schools & academy chains. 500+ active students (Unlimited).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOG: Academy Detail Modal */}
      {selectedAcademy && (
        <Dialog open={!!selectedAcademy} onOpenChange={() => setSelectedAcademy(null)}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                {selectedAcademy.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Detailed tenant branch records and subscription metadata.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Slug</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedAcademy.slug}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Domain URL</span>
                  <span className="font-mono text-blue-600">{selectedAcademy.slug}.eduflow.app</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Current Plan</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAcademy.isOnTrial ? `14-Day Free Trial (${selectedAcademy.plan})` : selectedAcademy.plan}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Tenant Status</span>
                  <span className="font-semibold text-emerald-600">{selectedAcademy.status}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="text-xs text-slate-400 uppercase font-semibold">Director / Admin Contact</div>
                <div className="font-medium text-slate-800">{selectedAcademy.adminName || "Not configured"}</div>
                <div className="text-slate-600 font-mono">{selectedAcademy.adminEmail || "—"}</div>
                <div className="text-slate-600 font-mono">{selectedAcademy.adminPhone || "—"}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Enrolled Students</span>
                  <span className="font-mono font-semibold text-base text-slate-900">
                    {selectedAcademy.studentsCount}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Faculty Teachers</span>
                  <span className="font-mono font-semibold text-base text-slate-900">
                    {selectedAcademy.teachersCount}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Trial Expiration</span>
                  <span className="font-mono text-slate-700">
                    {selectedAcademy.trialEndsAt ? selectedAcademy.trialEndsAt.split("T")[0] : "No trial"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">MRR Contribution</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {selectedAcademy.mrrLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAcademy(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG: Change Plan Modal */}
      {planChangeAcademy && (
        <Dialog open={!!planChangeAcademy} onOpenChange={() => setPlanChangeAcademy(null)}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Change Plan: {planChangeAcademy.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Select a new subscription tier for this academy branch.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {[
                {
                  tier: AcademyPlan.STARTER,
                  label: "Starter Plan",
                  price: "PKR 2,500 / month",
                  desc: "Up to 100 students, QR attendance, bank fee challans",
                },
                {
                  tier: AcademyPlan.GROWTH,
                  label: "Growth Plan",
                  price: "PKR 5,000 / month",
                  desc: "Up to 500 students, online test engine, AI dropout analytics",
                },
                {
                  tier: AcademyPlan.PRO,
                  label: "Pro Plan",
                  price: "PKR 9,000 / month",
                  desc: "Unlimited students, custom fee heads, multi-campus support",
                },
                {
                  tier: AcademyPlan.FREE,
                  label: "Free / Evaluation Tier",
                  price: "PKR 0 / month",
                  desc: "Complimentary access for test/sandbox branches",
                },
              ].map((item) => (
                <label
                  key={item.tier}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedNewPlan === item.tier
                      ? "border-purple-600 bg-purple-50/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan-tier"
                    value={item.tier}
                    checked={selectedNewPlan === item.tier}
                    onChange={() => setSelectedNewPlan(item.tier)}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{item.label}</span>
                      <span className="font-mono text-purple-700">{item.price}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlanChangeAcademy(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmPlanChange}
                disabled={isPending}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isPending ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                Save Plan Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
