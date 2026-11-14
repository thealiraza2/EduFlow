"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FaqAccordion() {
  const shouldReduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const faqs = [
    {
      question: "14-day free trial ke baad kya hota hai?",
      answer:
        "Trial khatam hone par aapka data mukammal mehfooz rehta hai. Aap apna pasandeeda plan (Starter, Growth, ya Pro) select kar ke payment kar saktay hain. Agar aap continue nahi karna chahtay, toh koi charges nahi kategay kyunke trial ke liye credit card required nahi hai.",
    },
    {
      question: "Kya hamara data safe aur private hai?",
      answer:
        "Jee haan, 100%. Har academy ka data alag database tenant mein isolated hota hai (strict multi-tenancy). Kisi doosri academy ya unauthorized shakhs ko aapke students, fees ya phone numbers tak rasai nahi mil sakti. Hum encrypted connections aur hourly backups use kartay hain.",
    },
    {
      question: "Kya WhatsApp ka kharcha alag se dena hoga?",
      answer:
        "AcademyHub software ke subscription mein WhatsApp messages ki processing shaamil hai. Lekin Meta (WhatsApp) har outbound conversation ka chhota sa official carrier fee leta hai (actual cost). Pro plan mein 500 messages mahana free shaamil hain. Testing ke doran aap built-in free log driver use kar saktay hain.",
    },
    {
      question: "Kya yeh software schools ke liye bhi use ho sakta hai?",
      answer:
        "Bilkul. AcademyHub tuition academies, coaching centers, evening academies aur regular matric/intermediate schools dono ke mutabiq design kiya gaya hai. Classes, sections, monthly fee challans aur board schemes school standard ke mutabiq hain.",
    },
    {
      question: "JazzCash aur Easypaisa se fee collection kaise kaam karti hai?",
      answer:
        "Parent portal ya fee challan par online pay ka button hota hai. Parents apnay mobile wallet se direct pay kartay hain. Payment complete hotay hi hamara webhook instant verify karta hai aur system invoice ko automatically 'PAID' mark kar ke parent ko SMS receipt bhej deta hai.",
    },
    {
      question: "Kya hamara purana student data import ho sakta hai?",
      answer:
        "Jee haan. Agar aapke paas Excel ya CSV sheet mein students ki list hai, toh hamari support team onboarding ke doran aapka purana data (students, roll numbers, phone numbers) bina kisi extra charge ke import karwa deti hai.",
    },
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-[#F5F1E9] border-t border-[#E8E2D6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#EAE4D7] px-3.5 py-1 text-xs font-semibold text-ink mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-pine" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight">
            Aksar poochay janay walay sawalat
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#55534D] font-sans">
            Wazahat ke sath jawabat — koi technical pechidagi nahi.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-xl border border-[#DDD6C8] bg-white overflow-hidden shadow-sm transition-colors duration-150"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-display text-base sm:text-lg font-bold text-ink">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-pine transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: "auto" },
                        collapsed: { opacity: 0, height: 0 },
                      }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.25,
                        ease: "easeInOut",
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-[#F2ECE1]">
                        <p className="text-sm sm:text-base text-[#55534D] leading-relaxed font-sans">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
