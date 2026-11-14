"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo on the left */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <Image
              src="/images/logo.svg"
              alt="EduFlow Logo"
              width={160}
              height={40}
              priority
              className="h-10 w-auto"
            />
            <span className="hidden sm:inline-block border-l border-gray-200 pl-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              School Management System
            </span>
          </Link>

          {/* Centre nav: Home / Features / Pricing / About / Contact with active yellow underline */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative text-sm py-1.5 transition-colors ${
                    active
                      ? "font-bold text-[#0F2040]"
                      : "font-semibold text-[#4B5563] hover:text-[#0F2040]"
                  }`}
                >
                  <span>{link.name}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#F5B800] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Login + Get Started Free */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full border border-[#0F2040] text-[#0F2040] font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#F5B800] text-[#0F2040] font-bold text-sm hover:bg-[#DF9E00] shadow-sm transition-all active:scale-[0.99]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex sm:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#0F2040] hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-100 py-4 px-2 space-y-2 bg-white">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base ${
                    active
                      ? "font-bold text-[#0F2040] bg-[#FFF9E6]"
                      : "font-semibold text-[#4B5563] hover:bg-gray-50 hover:text-[#0F2040]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-3 flex flex-col gap-2 border-t border-gray-100">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-full border border-[#0F2040] text-[#0F2040] font-semibold text-sm"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#F5B800] text-[#0F2040] font-bold text-sm"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
