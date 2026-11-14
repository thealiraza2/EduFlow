import Image from "next/image";

export function PhotoStrip() {
  return (
    <section className="py-12 bg-paper border-t border-[#E8E2D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden border border-[#DDD6C8] shadow-md bg-[#EFEAE0]">
          <Image
            src="/images/students-class.jpg"
            alt="School children and students studying in classroom in Pakistan"
            fill
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="object-cover photo-warm select-none"
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Caption overlay */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-center justify-between text-white text-xs sm:text-sm">
            <span className="font-display font-medium tracking-wide drop-shadow-sm">
              Dedicated to empowering teachers, students, and academies across Pakistan.
            </span>
            <span className="hidden sm:inline font-mono text-[11px] opacity-90 drop-shadow-sm">
              Session 2026–2027
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
