import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { PricingInteractive } from "@/components/marketing/PricingInteractive";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Pricing Plans — EduFlow",
  description:
    "Transparent pricing for Pakistani schools and tuition academies. Starter PKR 2,500/mo, Growth PKR 5,000/mo, Pro PKR 9,000/mo. 14-day free trial.",
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#0F2040]">
      <Header />

      <main className="flex-1">
        <PricingInteractive />
      </main>

      <Footer />
    </div>
  );
}
