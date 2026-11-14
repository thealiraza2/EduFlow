import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#DDD6C8] bg-[#FAF7F2] text-ink pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#E6E0D4]">
          {/* Brand & Purpose (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block font-display text-2xl font-bold tracking-tight text-ink">
              <span>Academy</span>
              <span className="text-pine">Hub</span>
            </Link>
            <p className="text-xs sm:text-sm text-[#55534D] leading-relaxed max-w-sm font-sans">
              The complete academy & school management system built for tuition centres, coaching institutes, and schools across Pakistan.
            </p>
            <div className="flex items-center gap-2 text-xs text-pine font-medium pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Multi-Tenant Database Isolation</span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#55534D]">
              <li>
                <a href="#features" className="hover:text-ink transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-ink transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-ink transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#trial" className="hover:text-ink transition-colors">
                  14-Day Free Trial
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: AcademyHub */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
              AcademyHub
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#55534D]">
              <li>
                <a href="#how-it-works" className="hover:text-ink transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-ink transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-ink transition-colors font-medium text-pine">
                  Portal Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-ink transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#55534D]">
              <li>
                <Link href="/privacy" className="hover:text-ink transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ink transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78756F]">
          <p>© {currentYear} AcademyHub. All rights reserved. Built for education in Pakistan.</p>
          <div className="flex items-center gap-6">
            <span>288 Punjab Pairing Schemes</span>
            <span>JazzCash & Easypaisa Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
