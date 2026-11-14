import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { FeaturesBento } from "@/components/marketing/FeaturesBento";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { PhotoStories } from "@/components/marketing/PhotoStories";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { FinalCta } from "@/components/marketing/FinalCta";
import { PhotoStrip } from "@/components/marketing/PhotoStrip";

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
          "highPrice": "90000",
          "offerCount": "3",
          "offers": [
            {
              "@type": "Offer",
              "name": "Starter",
              "price": "2500",
              "priceCurrency": "PKR",
              "description": "For up to 100 students (or PKR 25,000/year)",
            },
            {
              "@type": "Offer",
              "name": "Growth",
              "price": "5000",
              "priceCurrency": "PKR",
              "description": "For 101 to 500 students (or PKR 50,000/year)",
            },
            {
              "@type": "Offer",
              "name": "Pro",
              "price": "9000",
              "priceCurrency": "PKR",
              "description": "For 500+ students and multi-branch networks (or PKR 90,000/year)",
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

      <div className="flex flex-col min-h-screen bg-paper text-ink selection:bg-pine selection:text-paper font-sans">
        {/* Sticky Navbar */}
        <Navbar />

        <main className="flex-1">
          {/* Phase 1: Hero Section */}
          <HeroSection />

          {/* Phase 1: Trust Strip */}
          <TrustStrip />

          {/* Phase 2: Bento Grid Features */}
          <FeaturesBento />

          {/* Phase 2: How It Works */}
          <HowItWorks />

          {/* Phase 2: Photo-Led Alternating Story Sections */}
          <PhotoStories />

          {/* Phase 3: Pricing Section with Monthly/Annual Toggle */}
          <PricingSection />

          {/* Phase 3: FAQ Accordion */}
          <FaqAccordion />

          {/* Phase 3: Final CTA Section */}
          <FinalCta />

          {/* Phase 3: Wide 16:9 Photo Strip */}
          <PhotoStrip />

          {/* Phase 4 Target: Trial Signup Form Anchor */}
          <section id="trial" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E8E2D6]">
            <div className="rounded-2xl bg-[#EFEAE0] border border-[#DDD6C8] p-8 sm:p-12 text-center space-y-6">
              <span className="text-xs font-semibold text-pine uppercase tracking-wider">14-Day Free Trial</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
                Apni academy ko digital karein — aaj hi
              </h2>
              <p className="text-base text-[#5A5852] max-w-xl mx-auto font-sans">
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

          {/* Phase 4 Target: Contact Section Anchor */}
          <section id="contact" className="py-16 bg-[#F5F1E9] border-t border-[#E8E2D6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
              <span className="text-xs font-semibold text-pine uppercase tracking-wider">Contact</span>
              <h2 className="font-display text-2xl font-bold text-ink">
                Hamaray sath rabta karein
              </h2>
              <p className="text-sm text-[#55534D] max-w-md mx-auto">
                Sawalat ya custom requirement ke liye rabta karein. Hamari team 24 ghante ke andar reply karti hai.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E6E1D8] bg-[#FAF7F2] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B64]">
            <p>© {new Date().getFullYear()} AcademyHub. Built for education in Pakistan.</p>
            <div className="flex gap-6">
              <a href="#features" className="hover:text-ink">Features</a>
              <a href="#how-it-works" className="hover:text-ink">How it works</a>
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
