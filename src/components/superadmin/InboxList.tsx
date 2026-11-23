"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Mail, Phone, Search, Trash2 } from "lucide-react";
import { deleteContactSubmissionAction } from "@/lib/actions/superadmin";
import { fieldClass } from "./ConsoleUI";

interface Item {
  id: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
}

function when(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function InboxList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => `${i.name} ${i.contact} ${i.message}`.toLowerCase().includes(s));
  }, [items, q]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-10 text-center shadow-1">
        <Inbox className="mx-auto h-8 w-8 text-ink-3" strokeWidth={1.5} />
        <p className="mt-3 text-[16px] font-semibold text-ink">No messages yet</p>
        <p className="mt-1 text-[14px] text-ink-2">Messages from the website&apos;s Contact page will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="relative block max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <input className={fieldClass + " pl-9"} placeholder="Search name, phone, email or text" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <ul className="space-y-3">
        {shown.map((i) => {
          const email = i.contact.match(/[^\s•]+@[^\s•]+/)?.[0];
          const phone = i.contact.match(/\+?\d[\d\s-]{7,}/)?.[0]?.trim();
          return (
            <li key={i.id} className="rounded-2xl border border-line bg-surface p-4 shadow-1 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-ink">{i.name}</p>
                  <p className="mt-0.5 break-all text-[13px] text-ink-3">{i.contact}</p>
                </div>
                <p className="shrink-0 text-[13px] text-ink-3">{when(i.createdAt)}</p>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink-2">{i.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {email && (
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent("Re: your message to EduFlow")}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-hover"
                  >
                    <Mail className="h-3.5 w-3.5" /> Reply by email
                  </a>
                )}
                {phone && (
                  <a
                    href={`https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "92")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-semibold text-ink hover:bg-surface-sunken"
                  >
                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Delete the message from ${i.name}?`)) return;
                    setDeleting(i.id);
                    start(async () => {
                      await deleteContactSubmissionAction(i.id);
                      setDeleting(null);
                      router.refresh();
                    });
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-status-danger hover:bg-status-danger-bg disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> {deleting === i.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="text-[14px] text-ink-2">No messages match “{q}”.</p>}
    </div>
  );
}
