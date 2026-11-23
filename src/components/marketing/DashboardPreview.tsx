import { Users, GraduationCap, School, CreditCard, CheckCircle2, QrCode, FileText } from "lucide-react";

export function DashboardPreview() {
  const stats = [
    {
      label: "Total Students",
      value: "3",
      change: "Enrolled students",
      icon: Users,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      label: "Teachers",
      value: "2",
      change: "Active faculty",
      icon: GraduationCap,
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      label: "Classes",
      value: "1",
      change: "10th-A (Evening)",
      icon: School,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      label: "Pending Fees",
      value: "PKR 12,600",
      change: "3 unpaid invoices",
      icon: CreditCard,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
  ];

  const activities = [
    {
      id: 1,
      title: "Enrolled Hamza Tariq in 10th-A (Evening Batch)",
      timestamp: "15 Nov 2026",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      badge: "Admission",
    },
    {
      id: 2,
      title: "Attendance registered for 10th-A Evening Batch",
      timestamp: "15 Nov 2026",
      icon: QrCode,
      iconColor: "text-blue-500",
      badge: "Attendance",
    },
    {
      id: 3,
      title: "Midterm Physics Online Test graded and recorded",
      timestamp: "16 Nov 2026",
      icon: FileText,
      iconColor: "text-accent",
      badge: "Assessment",
    },
  ];

  return (
    <div className="w-full max-w-md lg:max-w-[420px] bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-3 p-3 sm:p-4 text-ink space-y-2.5 select-none">
      {/* Top Bar with Demo Indicator */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="font-semibold text-xs sm:text-sm tracking-tight text-ink">
            EduFlow Academy Portal
          </span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-xs font-semibold bg-primary-tint text-ink border border-primary/40">
          Live Demo Preview
        </span>
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-canvas rounded-xl py-1.5 px-2.5 sm:py-2 sm:px-2.5 border border-gray-100/90 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-xs font-medium text-gray-500 truncate mr-1">
                  {s.label}
                </span>
                <div className={`p-1 rounded-md ${s.iconBg}`}>
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>
              <div className="mt-0.5">
                <span className="text-base sm:text-lg font-semibold text-ink tracking-tight">
                  {s.value}
                </span>
                <p className="text-xs sm:text-xs text-gray-400 mt-0.5">{s.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity (3 Lines) */}
      <div className="pt-0.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs sm:text-xs font-semibold uppercase tracking-wider text-gray-500">
            Recent Activity (Demo)
          </span>
          <span className="text-xs sm:text-xs text-gray-400">Real-time sync</span>
        </div>

        <div className="space-y-1">
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                className="flex items-center justify-between py-1 px-2 rounded-lg bg-gray-50/80 border border-gray-100 text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${act.iconColor}`} />
                  <span className="text-gray-700 font-medium truncate text-xs sm:text-xs">
                    {act.title}
                  </span>
                </div>
                <span className="text-xs sm:text-xs text-gray-400 shrink-0 font-mono">
                  {act.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
