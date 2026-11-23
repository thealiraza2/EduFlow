import { Header } from "@/components/marketing/Header";
import { HeroSection } from "@/components/marketing/HeroSection";
import {
  FeaturesSection,
  HowItWorksSection,
  BuiltForPakistanSection,
  PricingTeaserSection,
  FaqSection,
} from "@/components/marketing/HomeSections";
import { PortalShowcase } from "@/components/marketing/PortalShowcase";
import { CtaSection } from "@/components/marketing/CtaSection";
import { Footer } from "@/components/marketing/Footer";

export const dynamic = "force-static";

export default function MarketingHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://eduflow.app/#organization",
        "name": "EduFlow",
        "url": "https://eduflow.app",
        "logo": "https://eduflow.app/images/logo.svg",
        "description":
          "Complete school management system for tuition academies, schools, and coaching centers.",
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://eduflow.app/#application",
        "name": "EduFlow",
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
          "Complete school management platform with student management, teacher allocation, QR attendance, fee challans, exam reports, and analytics.",
      },
    ],
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <PortalShowcase />
          <HowItWorksSection />
          <BuiltForPakistanSection />
          <PricingTeaserSection />
          <FaqSection />
          <CtaSection />
        </main>
        <Footer />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
