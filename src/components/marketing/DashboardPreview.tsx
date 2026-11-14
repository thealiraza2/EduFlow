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
    <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-2xl p-5 sm:p-6 text-[#0F2040] space-y-4 select-none">
      {/* Top Bar with Demo Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F5B800] animate-pulse" />
          <span className="font-bold text-sm tracking-tight text-[#0F2040]">
            EduFlow Academy Portal
          </span>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF9E6] text-[#0F2040] border border-[#F5B800]/40">
          Live Demo Preview
        </span>
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-[#FAFAFA] rounded-xl p-3 border border-gray-100 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500 truncate mr-1">
                  {s.label}
                </span>
                <div className={`p-1.5 rounded-lg ${s.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1.5">
                <span className="text-lg font-extrabold text-[#0F2040] tracking-tight">
                  {s.value}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity (3 Lines) */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Recent Activity (Demo)
          </span>
          <span className="text-[10px] text-gray-400">Real-time sync</span>
        </div>

        <div className="space-y-2">
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50/70 border border-gray-100 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${act.iconColor}`} />
                  <span className="text-gray-700 font-medium truncate text-[11px] sm:text-xs">
                    {act.title}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 font-mono">
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
