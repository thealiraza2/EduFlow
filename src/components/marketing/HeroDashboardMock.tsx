"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Clock, ShieldCheck, QrCode } from "lucide-react";

export function HeroDashboardMock() {
  const shouldReduceMotion = useReducedMotion();
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // Flip fee from Unpaid to Paid after 3.5 seconds to demonstrate live webhook callback
    const timer = setTimeout(() => {
      setIsPaid(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
        delayChildren: shouldReduceMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.4 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-lg bg-[#FAF7F2] rounded-2xl border border-[#DCD5C9] shadow-2xl p-5 sm:p-6 text-ink space-y-4 select-none backdrop-blur-sm"
    >
      {/* Academy Top Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between pb-3 border-b border-[#E6E0D4]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base tracking-tight text-ink">
              Iqbal Science Academy
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFEAE0] text-[#5A5852] border border-[#DDD6C8]">
              Lahore Branch
            </span>
          </div>
          <p className="text-xs text-[#6B6B64] mt-0.5">Session 2026–2027 • Class 10-A (Morning)</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>Active</span>
        </div>
      </motion.div>

      {/* Attendance Widget */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E6E0D4] p-3.5 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">
            Daily Attendance (QR Scan & Manual)
          </span>
          <span className="text-[#6B6B64] font-medium">3/4 Present</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D9]">
            <span className="font-medium text-ink truncate mr-1">Ahmed Raza</span>
            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Present
            </span>
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D9]">
            <span className="font-medium text-ink truncate mr-1">Fatima Noor</span>
            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Present
            </span>
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D9]">
            <span className="font-medium text-ink truncate mr-1">Bilal Tariq</span>
            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
              Absent
            </span>
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D9]">
            <span className="font-medium text-ink truncate mr-1">Zainab Bibi</span>
            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Present
            </span>
          </div>
        </div>

        <div className="text-[11px] text-[#787670] flex items-center gap-1.5 pt-1">
          <QrCode className="w-3.5 h-3.5 text-pine" />
          <span>Absence WhatsApp alert dispatched to Bilal Tariq&apos;s father</span>
        </div>
      </motion.div>

      {/* Live Fee Payment Row flipping to PAID */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl border border-[#E6E0D4] p-3.5 space-y-2 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">
            Fee Collection • Challan #INV-8421
          </span>
          <span className="font-mono font-semibold text-ink">PKR 4,500</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-medium text-ink">Hamza Malik</p>
            <p className="text-[11px] text-[#6B6B64]">Monthly Tuition • Via JazzCash Wallet</p>
          </div>

          <motion.div
            initial={false}
            animate={{
              scale: isPaid ? [1, 1.06, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm transition-all duration-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PAID</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 transition-all duration-300">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>VERIFYING</span>
              </span>
            )}
          </motion.div>
        </div>

        <div className="text-[11px] text-[#787670] flex items-center justify-between pt-1 border-t border-[#F2ECE1]">
          <span className="text-emerald-700 font-medium">
            {isPaid ? "✓ Instant webhook verified • Ledger balanced" : "Awaiting parent wallet confirmation..."}
          </span>
          <span className="text-[10px] text-[#918E86]">12:41 PM</span>
        </div>
      </motion.div>

      {/* Bottom Pairing Scheme Badge */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#EFECE4] border border-[#DDD6C8] text-xs text-[#4A4843]"
      >
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck className="w-4 h-4 text-pine shrink-0" />
          <span className="truncate">BISE Lahore 2026–27 Pairing Scheme Active</span>
        </div>
        <span className="font-semibold text-pine shrink-0 text-[11px]">288 Schemes</span>
      </motion.div>
    </motion.div>
  );
}
