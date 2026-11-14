import Image from "next/image";
import Link from "next/link";

export default function MarketingHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://academyhub.app/#organization",
        "name": "AcademyHub",
        "url": "https://academyhub.app",
        "logo": "https://academyhub.app/images/hero-classroom.jpg",
        "description":
          "Academy and school management software built for Pakistani tuition centres, schools, and coaching academies.",
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://academyhub.app/#application",
        "name": "AcademyHub",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "PKR",
          "lowPrice": "2500",
          "highPrice": "9000",
          "offerCount": "3",
          "offers": [
            {
              "@type": "Offer",
              "name": "Starter",
              "price": "2500",
              "priceCurrency": "PKR",
              "description": "For up to 100 students",
            },
            {
              "@type": "Offer",
              "name": "Growth",
              "price": "5000",
              "priceCurrency": "PKR",
              "description": "For 101 to 500 students",
            },
            {
              "@type": "Offer",
              "name": "Pro",
              "price": "9000",
              "priceCurrency": "PKR",
              "description": "For 500+ students and multi-branch networks",
            },
          ],
        },
        "description":
          "Tuition and school management system with 288 official Punjab BISE pairing schemes, 10-minute HMAC QR attendance, JazzCash/Easypaisa payments, fee challans, and parent WhatsApp updates.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        {/* Navigation placeholder */}
        <header className="border-b border-[#EAE6DE] bg-paper/90 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight text-ink">
              Academy<span className="text-pine">Hub</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/login" className="text-sm font-medium text-ink hover:text-pine transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-hover transition-colors"
              >
                Start free trial
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section Shell */}
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Real copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center rounded-full border border-[#D5D0C7] bg-[#F2EFE9] px-3.5 py-1 text-xs font-medium text-ink">
                Built specifically for schools & academies in Pakistan
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.12]">
                The complete academy & school management system built for Pakistan.
              </h1>
              <p className="text-lg sm:text-xl text-[#4A4A45] leading-relaxed max-w-2xl font-sans">
                Automate admissions, fee challans with JazzCash and Easypaisa, 10-minute QR attendance, and Punjab BISE pairing scheme test papers — all in one calm, unified platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-md bg-pine px-6 py-3.5 text-base font-medium text-white shadow-sm hover:bg-pine-hover transition-colors"
                >
                  Start 14-day free trial
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md border border-[#D5D0C7] bg-white px-6 py-3.5 text-base font-medium text-ink hover:bg-[#F2EFE9] transition-colors"
                >
                  View demo account
                </Link>
              </div>
              <div className="pt-4 flex items-center gap-6 text-xs text-[#6B6B64]">
                <span>✓ 14-day free trial</span>
                <span>✓ No credit card required</span>
                <span>✓ Pay via JazzCash / Easypaisa</span>
              </div>
            </div>

            {/* Right Column: Hero photo slot */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-[#E6E1D8]">
                <Image
                  src="/images/hero-classroom.jpg"
                  alt="Pakistani classroom with teacher and student"
                  fill
                  sizes="(max-width: 1024px) 100vw, 500px"
                  priority
                  className="object-cover photo-warm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Product photo slots strip */}
        <section className="py-12 border-t border-[#EAE6DE] bg-[#F4F0E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-ink mb-6 text-center">
              Field photography verification
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#E6E1D8]">
                  <Image
                    src="/images/teacher-attendance.jpg"
                    alt="Teacher assisting students in class"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover photo-warm"
                  />
                </div>
                <p className="text-xs font-medium text-[#4A4A45] text-center">teacher-attendance.jpg</p>
              </div>

              <div className="space-y-2">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#E6E1D8]">
                  <Image
                    src="/images/parent-phone.jpg"
                    alt="Parent checking smartphone for school notifications"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover photo-warm"
                  />
                </div>
                <p className="text-xs font-medium text-[#4A4A45] text-center">parent-phone.jpg</p>
              </div>

              <div className="space-y-2">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#E6E1D8]">
                  <Image
                    src="/images/principal-reports.jpg"
                    alt="Principal administrative desk with reports"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover photo-warm"
                  />
                </div>
                <p className="text-xs font-medium text-[#4A4A45] text-center">principal-reports.jpg</p>
              </div>

              <div className="space-y-2">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#E6E1D8]">
                  <Image
                    src="/images/students-class.jpg"
                    alt="Students studying in class"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover photo-warm"
                  />
                </div>
                <p className="text-xs font-medium text-[#4A4A45] text-center">students-class.jpg</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Shell */}
        <footer className="border-t border-[#EAE6DE] bg-paper py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B64]">
            <p>© {new Date().getFullYear()} AcademyHub. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/pricing" className="hover:text-ink">Pricing</Link>
              <Link href="/features" className="hover:text-ink">Features</Link>
              <Link href="/contact" className="hover:text-ink">Contact</Link>
              <Link href="/login" className="hover:text-ink">Portal Login</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
