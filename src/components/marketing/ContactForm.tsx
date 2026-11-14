"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Shukriya! Aapka message mil gaya hai. Hamari team jald rabta karegi.");
        setName("");
        setContact("");
        setMessage("");
      } else {
        setErrorMsg(data.error || "Message send nahi ho saka. Baraye meherbani dobara koshish karein.");
      }
    } catch (err: any) {
      setErrorMsg("Network error: Server se rabta nahi ho saka.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#DDD6C8] bg-white p-6 sm:p-8 shadow-sm max-w-xl mx-auto text-left">
      <div className="space-y-1 mb-6">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
          Hamaray Sath Rabta Karein
        </h3>
        <p className="text-xs sm:text-sm text-[#55534D]">
          Koi sawal ho ya live demo chahiye ho, yahan message bhejein.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span className="leading-snug">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="text-xs font-semibold text-ink">
            Aapka Naam
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            disabled={isSubmitting}
            placeholder="e.g. Usman Ali"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg border border-[#DDD6C8] text-sm text-ink placeholder:text-[#9A968D] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition-all"
          />
        </div>

        {/* Contact (Phone or Email) */}
        <div className="space-y-1.5">
          <label htmlFor="contact-info" className="text-xs font-semibold text-ink">
            Phone Number ya Email
          </label>
          <input
            id="contact-info"
            name="contact"
            type="text"
            required
            disabled={isSubmitting}
            placeholder="03001234567 ya director@academy.edu.pk"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg border border-[#DDD6C8] text-sm text-ink placeholder:text-[#9A968D] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition-all"
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label htmlFor="contact-message" className="text-xs font-semibold text-ink">
            Aapka Sawal ya Pegham
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            disabled={isSubmitting}
            placeholder="Apni academy ki requirements ya questions likhein..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3.5 rounded-lg border border-[#DDD6C8] text-sm text-ink placeholder:text-[#9A968D] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition-all resize-y min-h-[100px]"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-pine hover:bg-pine-hover text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Message Bhejein</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
