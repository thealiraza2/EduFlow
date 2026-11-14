import { Users, GraduationCap, QrCode, Receipt, FileSpreadsheet, BarChart3 } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Complete student profiles with admissions, guardians and fee history.",
    },
    {
      icon: GraduationCap,
      title: "Teacher Management",
      description: "Manage teachers, subjects, workload and performance in one place.",
    },
    {
      icon: QrCode,
      title: "Attendance",
      description: "Mark attendance digitally with QR in seconds and keep automatic records.",
    },
    {
      icon: Receipt,
      title: "Fee Management",
      description: "Automate invoices, challans, payments and reminders.",
    },
    {
      icon: FileSpreadsheet,
      title: "Exams & Results",
      description: "Create exams, evaluate and publish report cards instantly.",
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Turn school data into insights for better decisions.",
    },
  ];

  return (
    <section id="features" className="py-12 md:py-16 bg-[#FFF9E6]/40 border-y border-amber-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-[#FFF9E6] px-4 py-1.5 text-xs font-bold text-[#0F2040] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
            <span>CORE FEATURES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F2040] tracking-tight">
            Everything You Need to Run Your{" "}
            <span className="text-[#F5B800]">School</span>
          </h2>

          <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-2xl mx-auto">
            Comprehensive modules built specifically to replace scattered spreadsheets and paperwork with a single, dependable system.
          </p>
        </div>

        {/* 3-Column Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-[#F5B800]/30 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Yellow icon tile */}
                  <div className="w-12 h-12 rounded-xl bg-[#FFF9E6] border border-[#F5B800]/30 flex items-center justify-center text-[#F5B800] mb-4 sm:mb-5 shadow-sm">
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  {/* Dark navy title */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#0F2040]">
                    {feat.title}
                  </h3>

                  {/* Grey body copy */}
                  <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
