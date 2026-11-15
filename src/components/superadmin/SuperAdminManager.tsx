"use client";

import { useState, useTransition } from "react";
import { formatPKR } from "@/lib/money";
import { toggleAcademyStatusAction, updateAcademyPlanAction } from "@/lib/actions/superadmin";
import { AcademyPlan, AcademyStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Power,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export interface AcademyItem {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  plan: AcademyPlan;
  status: AcademyStatus;
  trialEndsAt: string | null;
  createdAt: string;
  studentsCount: number;
  teachersCount: number;
  adminEmail: string | null;
  adminName: string | null;
}

export interface PlatformStats {
  totalAcademies: number;
  activeAcademies: number;
  suspendedAcademies: number;
  proCount: number;
  freeCount: number;
  totalStudents: number;
  monthlyRevenueMinor: number;
}

interface Props {
  initialAcademies: AcademyItem[];
  stats: PlatformStats;
}

export function SuperAdminManager({ initialAcademies, stats }: Props) {
  const [academies, setAcademies] = useState<AcademyItem[]>(initialAcademies);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const handleToggleStatus = (academyId: string, currentStatus: AcademyStatus) => {
    const newStatus = currentStatus === AcademyStatus.ACTIVE ? AcademyStatus.SUSPENDED : AcademyStatus.ACTIVE;
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

  const handleTogglePlan = (academyId: string, currentPlan: AcademyPlan) => {
    const newPlan = currentPlan === AcademyPlan.PRO ? AcademyPlan.FREE : AcademyPlan.PRO;
    setActionId(academyId);

    startTransition(async () => {
      try {
        await updateAcademyPlanAction(academyId, newPlan);
        setAcademies((prev) =>
          prev.map((a) => (a.id === academyId ? { ...a, plan: newPlan } : a))
        );
      } finally {
        setActionId(null);
      }
    });
  };

  const filtered = academies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      (a.adminEmail && a.adminEmail.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchesPlan = filterPlan === "ALL" || a.plan === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="space-y-6">
      {/* Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Platform MRR (Estimated)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {formatPKR(stats.monthlyRevenueMinor)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.proCount} PRO subscriptions @ PKR 15,000/mo (record-only)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Total Academies
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalAcademies}</div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold">{stats.activeAcademies} Active</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">{stats.suspendedAcademies} Suspended</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Subscription Plans
            </CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.proCount} PRO</div>
            <p className="text-[11px] text-slate-400 mt-1">{stats.freeCount} Free tier academies</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Total Enrolled Students
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
            <p className="text-[11px] text-slate-400 mt-1">Across all registered tenant branches</p>
          </CardContent>
        </Card>
      </div>

      {/* Academies Table & Filters */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Tenant Academies Directory</CardTitle>
              <CardDescription className="text-xs">
                Manage branch accounts, plan tiers, and platform suspension controls.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Search academy or slug..."
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
                <option value="PRO">PRO Plan</option>
                <option value="FREE">FREE Plan</option>
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
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Students</th>
                  <th className="py-3 px-4">Admin Contact</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No academies found matching your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((academy) => {
                    const isActing = isPending && actionId === academy.id;

                    return (
                      <tr key={academy.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{academy.name}</div>
                          <div className="font-mono text-[11px] text-blue-600 mt-0.5">
                            {academy.slug}.eduflow.app
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant={academy.plan === "PRO" ? "default" : "secondary"}
                            className={`text-[10px] font-bold ${
                              academy.plan === "PRO" ? "bg-purple-600 text-white" : ""
                            }`}
                          >
                            {academy.plan}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant={academy.status === "ACTIVE" ? "default" : "destructive"}
                            className={`text-[10px] uppercase font-bold ${
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
                          <div className="text-[11px] text-slate-400">{academy.adminEmail || "—"}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {academy.createdAt.split("T")[0]}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Plan Switcher */}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActing}
                            onClick={() => handleTogglePlan(academy.id, academy.plan)}
                            className="h-7 text-[11px] px-2"
                            title="Toggle between FREE and PRO plan"
                          >
                            Switch to {academy.plan === "PRO" ? "FREE" : "PRO"}
                          </Button>

                          {/* Suspend / Activate */}
                          <Button
                            size="sm"
                            variant={academy.status === "ACTIVE" ? "destructive" : "default"}
                            disabled={isActing}
                            onClick={() => handleToggleStatus(academy.id, academy.status)}
                            className={`h-7 text-[11px] px-2.5 ${
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
    </div>
  );
}
