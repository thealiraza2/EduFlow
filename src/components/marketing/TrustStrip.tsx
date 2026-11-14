import { BookCheck, QrCode, Wallet } from "lucide-react";

export function TrustStrip() {
  const trustItems = [
    {
      icon: BookCheck,
      title: "288 Punjab board pairing schemes built in",
      description: "Official 9th–12th schemes across all 9 Punjab BISE boards for verified test paper generation.",
    },
    {
      icon: QrCode,
      title: "QR attendance in 10-minute secure tokens",
      description: "HMAC-signed cryptographic tokens eliminate proxy marking and instantly update parent portals.",
    },
    {
      icon: Wallet,
      title: "JazzCash & Easypaisa fee collection",
      description: "Automated wallet webhook reconciliation immediately marks invoices paid and issues SMS alerts.",
    },
  ];

  return (
    <section className="border-y border-[#E8E2D6] bg-[#F5F1E9] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2DCCE]">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex items-start gap-4 ${
                  index === 0 ? "pb-6 md:pb-0 md:pr-8" : index === 1 ? "py-6 md:py-0 md:px-8" : "pt-6 md:pt-0 md:pl-8"
                }`}
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-white border border-[#DDD6C8] flex items-center justify-center text-pine shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-sm sm:text-base text-ink leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#5C5A54] leading-relaxed">
                    {item.description}
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
