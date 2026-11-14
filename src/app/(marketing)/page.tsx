import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { TrustStrip } from "@/components/marketing/TrustStrip";

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

      <div className="flex flex-col min-h-screen bg-paper text-ink">
        {/* Sticky Navbar */}
        <Navbar />

        <main className="flex-1">
          {/* Phase 1: Hero Section with Photo + Real JSX Floating Dashboard */}
          <HeroSection />

          {/* Phase 1: Trust Strip with Honest Product Metrics */}
          <TrustStrip />

          {/* Features Section Anchor */}
          <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4 max-w-2xl">
              <span className="text-xs font-semibold text-pine uppercase tracking-wider">Features</span>
              <h2 className="font-display text-3xl font-bold text-ink">
                Har feature Pakistan ke educational landscape ke mutabiq.
              </h2>
              <p className="text-sm text-[#5A5852] leading-relaxed">
                Attendance, fee challans, parent WhatsApp updates, aur board exams — sab kuch interconnected.
              </p>
            </div>
          </section>

          {/* How It Works Anchor */}
          <section id="how-it-works" className="py-16 bg-[#F5F1E9] border-t border-[#E8E2D6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <span className="text-xs font-semibold text-pine uppercase tracking-wider">Workflow</span>
              <h2 className="font-display text-2xl font-bold text-ink mt-2">
                Teen asaan steps mein shuru karein
              </h2>
            </div>
          </section>

          {/* Pricing Anchor */}
          <section id="pricing" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E8E2D6]">
            <span className="text-xs font-semibold text-pine uppercase tracking-wider">Pricing</span>
            <h2 className="font-display text-2xl font-bold text-ink mt-2">
              Transparent pricing — no hidden fees
            </h2>
          </section>

          {/* FAQ Anchor */}
          <section id="faq" className="py-16 bg-[#F5F1E9] border-t border-[#E8E2D6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <span className="text-xs font-semibold text-pine uppercase tracking-wider">FAQ</span>
              <h2 className="font-display text-2xl font-bold text-ink mt-2">
                Aksar poochay janay walay sawalat
              </h2>
            </div>
          </section>

          {/* Trial / Signup Form Anchor */}
          <section id="trial" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E8E2D6]">
            <div className="rounded-2xl bg-[#EFEAE0] border border-[#DDD6C8] p-8 sm:p-12 text-center space-y-6">
              <span className="text-xs font-semibold text-pine uppercase tracking-wider">14-Day Free Trial</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
                Apni academy ko digital karein — aaj hi
              </h2>
              <p className="text-base text-[#5A5852] max-w-xl mx-auto">
                No credit card required. Setup takes under two minutes. 14 days full access with all 288 Punjab pairing schemes and automated fee collection.
              </p>
              <div className="pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-pine px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-pine-hover transition-colors"
                >
                  Create Trial Academy
                </Link>
              </div>
            </div>
          </section>

          {/* Contact Anchor */}
          <section id="contact" className="py-16 bg-[#F5F1E9] border-t border-[#E8E2D6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <span className="text-xs font-semibold text-pine uppercase tracking-wider">Contact</span>
              <h2 className="font-display text-2xl font-bold text-ink mt-2">
                Hamaray sath rabta karein
              </h2>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E6E1D8] bg-[#FAF7F2] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B64]">
            <p>© {new Date().getFullYear()} AcademyHub. Built for education in Pakistan.</p>
            <div className="flex gap-6">
              <a href="#features" className="hover:text-ink">Features</a>
              <a href="#pricing" className="hover:text-ink">Pricing</a>
              <a href="#faq" className="hover:text-ink">FAQ</a>
              <a href="#contact" className="hover:text-ink">Contact</a>
              <Link href="/login" className="hover:text-ink font-medium text-pine">Portal Login</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
