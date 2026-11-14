import { Users, GraduationCap, School, CreditCard, CheckCircle2, QrCode, FileText } from "lucide-react";

export function DashboardPreview() {
  const stats = [
    {
      label: "Total Students",
      value: "850",
      change: "+12 this month",
      icon: Users,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      label: "Teachers",
      value: "42",
      change: "Active faculty",
      icon: GraduationCap,
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      label: "Classes",
      value: "24",
      change: "Morning & Eve",
      icon: School,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      label: "Pending Fees",
      value: "PKR 45,000",
      change: "3 invoices overdue",
      icon: CreditCard,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
  ];

  const activities = [
    {
      id: 1,
      title: "Admitted Ahmed Raza to Class 10-A",
      timestamp: "10 mins ago",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      badge: "Admission",
    },
    {
      id: 2,
      title: "QR Attendance marked for Class 9-B (31/33 Present)",
      timestamp: "25 mins ago",
      icon: QrCode,
      iconColor: "text-blue-500",
      badge: "Attendance",
    },
    {
      id: 3,
      title: "Fee Challan #1042 marked Paid via JazzCash",
      timestamp: "1 hour ago",
      icon: FileText,
      iconColor: "text-[#F5B800]",
      badge: "Fee Payment",
    },
  ];

  return (
    <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-2xl p-4 sm:p-5 text-[#0F2040] space-y-3 select-none">
      {/* Top Bar with Demo Indicator */}
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F5B800] animate-pulse" />
          <span className="font-bold text-xs sm:text-sm tracking-tight text-[#0F2040]">
            EduFlow Academy Portal
          </span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#FFF9E6] text-[#0F2040] border border-[#F5B800]/40">
          Live Demo Preview
        </span>
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-[#FAFAFA] rounded-xl p-2 sm:p-2.5 border border-gray-100/90 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 truncate mr-1">
                  {s.label}
                </span>
                <div className={`p-1 sm:p-1.5 rounded-lg ${s.iconBg}`}>
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-extrabold text-[#0F2040] tracking-tight">
                  {s.value}
                </span>
                <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{s.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity (3 Lines) */}
      <div className="pt-0.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Recent Activity (Demo)
          </span>
          <span className="text-[9px] sm:text-[10px] text-gray-400">Real-time sync</span>
        </div>

        <div className="space-y-1.5">
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-gray-50/80 border border-gray-100 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${act.iconColor}`} />
                  <span className="text-gray-700 font-medium truncate text-[10px] sm:text-xs">
                    {act.title}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-gray-400 shrink-0 font-mono">
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
