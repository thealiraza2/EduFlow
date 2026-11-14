import dynamic from "next/dynamic";
import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { TrustStrip } from "@/components/marketing/TrustStrip";
import { FeaturesBento } from "@/components/marketing/FeaturesBento";
import { PhotoStories } from "@/components/marketing/PhotoStories";
import { FinalCta } from "@/components/marketing/FinalCta";
import { PhotoStrip } from "@/components/marketing/PhotoStrip";
import { Footer } from "@/components/marketing/Footer";

const HowItWorks = dynamic(
  () => import("@/components/marketing/HowItWorks").then((m) => m.HowItWorks),
  { ssr: true }
);
const PricingSection = dynamic(
  () => import("@/components/marketing/PricingSection").then((m) => m.PricingSection),
  { ssr: true }
);
const FaqAccordion = dynamic(
  () => import("@/components/marketing/FaqAccordion").then((m) => m.FaqAccordion),
  { ssr: true }
);
const TrialSignupForm = dynamic(
  () => import("@/components/marketing/TrialSignupForm").then((m) => m.TrialSignupForm),
  { ssr: true }
);
const ContactForm = dynamic(
  () => import("@/components/marketing/ContactForm").then((m) => m.ContactForm),
  { ssr: true }
);

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

          {/* Phase 2: How It Works (3 Steps) */}
          <HowItWorks />

          {/* Phase 2: Photo-Led Alternating Story Sections */}
          <PhotoStories />

          {/* Phase 3: Pricing Section with Interactive Billing Toggle */}
          <PricingSection />

          {/* Phase 3: FAQ Accordion */}
          <FaqAccordion />

          {/* Phase 3: Final CTA Section */}
          <FinalCta />

          {/* Phase 4: Shared 14-Day Free Trial Signup Form Section */}
          <section id="trial" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E8E2D6] text-center">
            <div className="max-w-2xl mx-auto mb-10 space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#EAE4D7] text-ink border border-[#D8D1C4]">
                Instant Provisioning
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                Apni academy ko digital karein — aaj hi
              </h2>
              <p className="text-sm sm:text-base text-[#55534D]">
                Form fill karein aur foran apna 14-day free trial portal shuru karein. Koi credit card required nahi hai.
              </p>
            </div>

            {/* Real 100% Functional Trial Signup Form Component */}
            <TrialSignupForm />
          </section>

          {/* Phase 4: Contact Us Section with Real Submissions & Rate Limiting */}
          <section id="contact" className="py-20 md:py-28 bg-[#F5F1E9] border-t border-[#E8E2D6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ContactForm />
            </div>
          </section>

          {/* Phase 3: Wide 16:9 Photo Strip */}
          <PhotoStrip />
        </main>

        {/* Phase 4: Semantic Multi-Column Footer */}
        <Footer />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
