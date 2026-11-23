"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, ChevronDown, HelpCircle, MessageSquare } from "lucide-react";

export function ContactFormInteractive() {
  const topics = [
    "Book a demo",
    "Pricing & plans",
    "Technical support",
    "Partnership",
    "Other",
  ];

  const [selectedTopic, setSelectedTopic] = useState("Book a demo");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          schoolName,
          topic: selectedTopic,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setSuccess("Thank you! Your message has been received. Our team will contact you shortly.");
      setName("");
      setEmail("");
      setPhone("");
      setSchoolName("");
      setMessage("");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "How quickly will someone contact me?",
      answer:
        "We typically respond within 24 hours during working days via email or phone to answer your questions or schedule a demo.",
    },
    {
      question: "Can I schedule a one-on-one live demo for my administration?",
      answer:
        "Yes! Select 'Book a demo' in the topic selector above, and we will schedule an interactive walkthrough tailored to your school or academy's specific workflows.",
    },
    {
      question: "Do you provide on-site or remote staff training?",
      answer:
        "Yes. We offer comprehensive remote onboarding and guided training sessions for principals, administrative staff, and teachers to help your team get started smoothly.",
    },
  ];

  return (
    <div className="space-y-16 py-12 sm:py-16">
      {/* Contact Header */}
      <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-tint px-4 py-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>GET IN TOUCH</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink ">
          Let&apos;s Talk About Your <span className="text-accent">School</span>
        </h1>

        <p className="text-base sm:text-lg text-ink-2 max-w-2xl mx-auto">
          Have questions, need a live walkthrough, or want to discuss a custom setup? Email us directly at{" "}
          <a href="mailto:support@eduflow.app" className="font-semibold text-ink underline hover:text-accent">
            support@eduflow.app
          </a>{" "}
          or send a message through the form below.
        </p>
      </div>

      {/* Main Grid: Form + Honest Info Box */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-3 p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Banner */}
            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Topic Pills */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                Select Topic
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {topics.map((t) => {
                  const active = selectedTopic === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTopic(t)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        active
                          ? "bg-primary text-white shadow-1 ring-2 ring-primary"
                          : "bg-gray-100 text-ink-2 hover:bg-gray-200 hover:text-ink"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Phone Number (WhatsApp)
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-school" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                  School / Academy Name
                </label>
                <input
                  id="contact-school"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Your school or academy name"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Message Field */}
            <div className="space-y-1.5">
              <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="contact-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your institution, student count, or specific questions..."
                className="w-full p-3.5 rounded-xl border border-gray-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white hover:bg-primary-hover shadow-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer min-h-[48px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-1" />
                  <span>Sending message...</span>
                </>
              ) : (
                <>
                  <span>Send Message</span>
                  <Send className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 3-Question FAQ Accordion */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-tint px-3.5 py-1 text-xs font-semibold text-ink uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span>COMMUNICATION FAQS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-1 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-semibold text-base text-ink hover:bg-gray-50/80 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-accent shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-ink-2 leading-relaxed border-t border-gray-100 bg-canvas">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
