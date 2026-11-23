"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, Loader2, Megaphone } from "@/components/icons";
import { sendPlatformAnnouncementAction } from "@/lib/actions/superadmin";
import { ConsoleSection, fieldClass, primaryBtn } from "./ConsoleUI";

export function AnnouncementComposer({ counts }: { counts: { all: number; active: number; trial: number } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ title: "", content: "", audience: "ALL", target: "active" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const targetCount = form.target === "all" ? counts.all : form.target === "trial" ? counts.trial : counts.active;

  return (
    <ConsoleSection title="New announcement" description="It appears on the dashboards of the people you choose, inside each academy.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          if (!confirm(`Post this announcement to ${targetCount} academ${targetCount === 1 ? "y" : "ies"}?`)) return;
          start(async () => {
            const res = await sendPlatformAnnouncementAction({
              ...form,
              audience: form.audience as "ALL" | "TEACHERS" | "PARENTS",
              target: form.target as "all" | "active" | "trial",
            });
            if (res.success) {
              setMsg({ ok: true, text: `Posted to ${res.count} academ${res.count === 1 ? "y" : "ies"}.` });
              setForm((f) => ({ ...f, title: "", content: "" }));
              router.refresh();
            } else setMsg({ ok: false, text: res.error });
          });
        }}
      >
        {msg && (
          <p
            role={msg.ok ? "status" : "alert"}
            className={
              "flex items-start gap-2 rounded-xl p-3.5 text-[14px] " +
              (msg.ok ? "bg-status-success-bg text-status-success" : "bg-status-danger-bg text-status-danger")
            }
          >
            {msg.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
            {msg.text}
          </p>
        )}
        <label className="block space-y-1.5">
          <span className="text-[14px] font-medium text-ink">Title</span>
          <input
            className={fieldClass}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            maxLength={120}
            placeholder="e.g. Scheduled maintenance on Sunday 7–8 am"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[14px] font-medium text-ink">Message</span>
          <textarea
            className={fieldClass + " h-auto min-h-[120px] py-2.5 leading-relaxed"}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
            maxLength={2000}
            placeholder="Write the full notice. Urdu or English both work."
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">Which academies</span>
            <select className={fieldClass} value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
              <option value="active">Active academies ({counts.active})</option>
              <option value="trial">Academies on trial ({counts.trial})</option>
              <option value="all">All academies ({counts.all})</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">Who sees it</span>
            <select className={fieldClass} value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}>
              <option value="ALL">Everyone in the academy</option>
              <option value="TEACHERS">Teachers only</option>
              <option value="PARENTS">Parents only</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={pending || targetCount === 0} className={primaryBtn}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
          Post to {targetCount} academ{targetCount === 1 ? "y" : "ies"}
        </button>
      </form>
    </ConsoleSection>
  );
}
