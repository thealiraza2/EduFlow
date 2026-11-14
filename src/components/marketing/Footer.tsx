import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 text-[#0F2040]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-gray-100">
          {/* Brand & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-2.5 text-center md:text-left">
            <Link href="/" className="inline-block focus:outline-none">
              <Image
                src="/images/logo.svg"
                alt="EduFlow Logo"
                width={150}
                height={38}
                className="h-9 w-auto"
              />
            </Link>
            <p className="text-sm text-[#4B5563] max-w-sm">
              Modern, all-in-one school management software designed for Pakistani academies and schools.
            </p>
          </div>

          {/* Nav links (Features / Pricing / About / Contact / Login / Sign Up / Privacy / Terms) */}
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 sm:gap-x-7 gap-y-3 text-sm font-semibold text-[#0F2040]">
            <Link href="/" className="hover:text-[#F5B800] transition-colors">
              Home
            </Link>
            <Link href="/features" className="hover:text-[#F5B800] transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-[#F5B800] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-[#F5B800] transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-[#F5B800] transition-colors">
              Contact
            </Link>
            <Link href="/login" className="hover:text-[#F5B800] transition-colors">
              Login
            </Link>
            <Link href="/signup" className="hover:text-[#F5B800] transition-colors">
              Sign Up
            </Link>
            <Link href="/privacy" className="hover:text-[#F5B800] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#F5B800] transition-colors">
              Terms of Service
            </Link>
          </nav>
        </div>

        {/* Bottom Bar: Copyright only, no fake social links */}
        <div className="pt-8 text-center text-xs text-[#6B7280]">
          <p>© 2026 EduFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
