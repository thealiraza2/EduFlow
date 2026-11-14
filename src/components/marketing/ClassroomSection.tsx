import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export function ClassroomSection() {
  const bullets = [
    "Access from anywhere, anytime",
    "Secure cloud-based platform",
    "Customizable for schools of all sizes",
  ];

  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: AI-Generated Classroom Photo */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-gray-100">
              <Image
                src="/images/classroom.jpg"
                alt="Teacher guiding teenage students on laptops in bright modern classroom"
                fill
                quality={90}
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>

          {/* Right Column: Eyebrow, H2, Copy, Bullets, Button */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-[#FFF9E6] px-4 py-1.5 text-xs font-bold text-[#0F2040] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
              <span>FOR A SMARTER SCHOOL</span>
            </div>

            {/* H2 with one word highlighted in yellow */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F2040] tracking-tight leading-tight">
              Simplify Daily Operations, Focus on{" "}
              <span className="text-[#F5B800]">What Matters</span>
            </h2>

            {/* Copy */}
            <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
              Our system helps academies and schools save time, reduce manual work and provide a better learning experience for students, parents and staff.
            </p>

            {/* 3 Bullets */}
            <div className="space-y-3.5 pt-2">
              {bullets.map((bullet) => (
                <div key={bullet} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FFF9E6] border border-[#F5B800]/50 flex items-center justify-center text-[#F5B800] shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-[#0F2040]">
                    {bullet}
                  </span>
                </div>
              ))}
            </div>

            {/* Button */}
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5B800] px-7 py-3.5 text-base font-bold text-[#0F2040] hover:bg-[#DF9E00] shadow-md transition-all active:scale-[0.99]"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
