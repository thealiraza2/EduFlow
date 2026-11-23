"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Pencil, Plus, Trash2, Upload } from "@/components/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fieldClass, primaryBtn, secondaryBtn } from "@/components/superadmin/ConsoleUI";
import { urdu } from "@/lib/fonts/urdu";
import {
  createBookAction, deleteQuestionsAction, deleteUnitAction, importQuestionsAction,
  setBookCurrentAction, setQuestionStatusAction, updateQuestionAction, upsertTopicAction, upsertUnitAction,
} from "@/lib/actions/bank";

const label = "mb-1 block text-[13px] font-semibold text-ink-2";
const ErrorLine = ({ msg }: { msg: string | null }) => (msg ? <p role="alert" className="mt-2 text-[14px] font-medium text-status-danger">{msg}</p> : null);

/* ───────────────────────── Books ───────────────────────── */

export function BookCreateForm({ authorities }: { authorities: { id: string; code: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ authorityId: authorities[0]?.id ?? "", className: "9", subject: "", subjectUr: "", edition: "National Curriculum 2023", sessionFrom: "2025", sourceUrl: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          const r = await createBookAction({ ...f, className: f.className as "9" | "10" | "11" | "12", sessionFrom: Number(f.sessionFrom) });
          if (!r.ok) return setErr(r.error);
          router.push(`/superadmin/bank/${r.data!.id}`);
        });
      }}
      className="grid gap-4 sm:grid-cols-3"
    >
      <div>
        <label className={label}>Textbook authority</label>
        <select className={fieldClass} value={f.authorityId} onChange={set("authorityId")}>
          {authorities.map((a) => <option key={a.id} value={a.id}>{a.code}</option>)}
        </select>
      </div>
      <div>
        <label className={label}>Class</label>
        <select className={fieldClass} value={f.className} onChange={set("className")}>
          {["9", "10", "11", "12"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className={label}>Taught from session</label>
        <input className={fieldClass} inputMode="numeric" value={f.sessionFrom} onChange={set("sessionFrom")} />
      </div>
      <div>
        <label className={label}>Subject (English)</label>
        <input className={fieldClass} placeholder="Physics" value={f.subject} onChange={set("subject")} />
      </div>
      <div>
        <label className={label}>Subject (Urdu)</label>
        <input className={`${fieldClass} ${urdu.className}`} dir="rtl" placeholder="طبیعیات" value={f.subjectUr} onChange={set("subjectUr")} />
      </div>
      <div>
        <label className={label}>Edition</label>
        <input className={fieldClass} value={f.edition} onChange={set("edition")} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Link to the official book (optional)</label>
        <input className={fieldClass} placeholder="https://…" value={f.sourceUrl} onChange={set("sourceUrl")} />
      </div>
      <div className="flex items-end">
        <button className={primaryBtn} disabled={pending}><Plus className="h-4 w-4" />{pending ? "Adding…" : "Add textbook"}</button>
      </div>
      <div className="sm:col-span-3"><ErrorLine msg={err} /></div>
    </form>
  );
}

export function MakeCurrentButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="rounded-full border border-line-strong px-3 py-1 text-[12px] font-semibold text-ink hover:bg-surface-sunken"
      disabled={pending}
      onClick={() => start(async () => { await setBookCurrentAction(bookId); router.refresh(); })}
    >
      {pending ? "…" : "Make current"}
    </button>
  );
}

/* ───────────────────────── Units & topics ───────────────────────── */

type UnitRow = { id: string; number: number; title: string; titleUr: string | null; questions: number; topics: { id: string; code: string; title: string }[] };

export function UnitEditor({ bookId, units }: { bookId: string; units: UnitRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [u, setU] = useState({ number: String((units.at(-1)?.number ?? 0) + 1), title: "", titleUr: "" });
  const [topicFor, setTopicFor] = useState<string | null>(null);
  const [t, setT] = useState({ code: "", title: "" });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setErr(null);
      const r = await fn();
      if (!r.ok) return setErr(r.error ?? "Failed");
      after?.();
      router.refresh();
    });

  return (
    <div className="space-y-4">
      {units.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {units.map((unit) => (
            <li key={unit.id} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[15px] font-semibold text-ink">
                  Unit {unit.number}: {unit.title}
                  {unit.titleUr && <span className={`${urdu.className} mr-2 text-ink-3`} dir="rtl"> {unit.titleUr}</span>}
                </p>
                <div className="flex items-center gap-2 text-[13px] text-ink-3">
                  <span>{unit.questions} questions</span>
                  <button className="rounded-full border border-line-strong px-3 py-1 font-semibold text-ink hover:bg-surface-sunken" onClick={() => { setTopicFor(topicFor === unit.id ? null : unit.id); setT({ code: `${unit.number}.${unit.topics.length + 1}`, title: "" }); }}>
                    Add topic
                  </button>
                  <button aria-label={`Delete unit ${unit.number}`} className="rounded-full p-1.5 text-ink-3 hover:bg-status-danger-bg hover:text-status-danger" onClick={() => run(() => deleteUnitAction(unit.id))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {unit.topics.length > 0 && (
                <p className="mt-1 text-[13px] text-ink-2">{unit.topics.map((tp) => `${tp.code} ${tp.title}`).join("   ·   ")}</p>
              )}
              {topicFor === unit.id && (
                <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); run(() => upsertTopicAction({ unitId: unit.id, ...t }), () => setT({ code: "", title: "" })); }}>
                  <input className={`${fieldClass} w-24`} placeholder="1.1" value={t.code} onChange={(e) => setT({ ...t, code: e.target.value })} />
                  <input className={`${fieldClass} min-w-[220px] flex-1`} placeholder="Topic title" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} />
                  <button className={secondaryBtn} disabled={pending}>Save topic</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      <form className="grid gap-2 sm:grid-cols-[90px_1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); run(() => upsertUnitAction({ bookId, ...u, number: Number(u.number) }), () => setU({ number: String(Number(u.number) + 1), title: "", titleUr: "" })); }}>
        <input className={fieldClass} inputMode="numeric" aria-label="Unit number" value={u.number} onChange={(e) => setU({ ...u, number: e.target.value })} />
        <input className={fieldClass} placeholder="Unit title in English" value={u.title} onChange={(e) => setU({ ...u, title: e.target.value })} />
        <input className={`${fieldClass} ${urdu.className}`} dir="rtl" placeholder="یونٹ کا نام (اختیاری)" value={u.titleUr} onChange={(e) => setU({ ...u, titleUr: e.target.value })} />
        <button className={primaryBtn} disabled={pending}><Plus className="h-4 w-4" />Add unit</button>
      </form>
      <ErrorLine msg={err} />
    </div>
  );
}

/* ───────────────────────── Import ───────────────────────── */

export function ImportPanel({ bookId }: { bookId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string; errors?: { line: number; message: string }[] } | null>(null);

  const onFile = async (file: File) => {
    const text = await file.text();
    start(async () => {
      const r = await importQuestionsAction(bookId, text);
      if (!r.ok) return setMsg({ ok: false, text: r.error, errors: "errors" in r ? r.errors : undefined });
      const d = r.data!;
      setMsg({ ok: true, text: `Imported ${d.created} questions${d.units ? `, created ${d.units} units` : ""}${d.topics ? ` and ${d.topics} topics` : ""}. They are waiting for your review below.` });
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a href="/api/bank/template" className={secondaryBtn}><Download className="h-4 w-4" />Download template</a>
        <button className={primaryBtn} disabled={pending} onClick={() => input.current?.click()}>
          <Upload className="h-4 w-4" />{pending ? "Importing…" : "Upload CSV"}
        </button>
        <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      </div>
      <p className="text-[13px] text-ink-3">
        Columns: unit, unit_title, topic, topic_title, type (MCQ / SHORT / LONG), source (exercise / past_paper / additional / conceptual), question_en, question_ur,
        a_en … d_ur (MCQ options), answer (A–D for MCQs), marks, past_paper.
      </p>
      {msg && (
        <div className={"rounded-xl border p-3 text-[14px] " + (msg.ok ? "border-status-success/30 bg-status-success-bg text-status-success" : "border-status-danger/30 bg-status-danger-bg text-status-danger")}>
          <p className="font-semibold">{msg.text}</p>
          {msg.errors && (
            <ul className="mt-2 max-h-48 list-disc space-y-0.5 overflow-auto pl-5 text-[13px] font-normal text-ink">
              {msg.errors.map((e, i) => <li key={i}>Row {e.line}: {e.message}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Questions ───────────────────────── */

export type AdminQuestion = {
  id: string; unit: number; topic: string | null; type: "MCQ" | "SHORT" | "LONG"; source: string; status: "DRAFT" | "REVIEWED";
  textEn: string | null; textUr: string | null; options: { en: string; ur: string }[] | null; answer: string | null; marks: number; pastPaperRef: string | null;
};

export function QuestionTable({ rows }: { rows: AdminQuestion[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const ids = [...sel];

  const bulk = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { setErr(null); const r = await fn(); if (!r.ok) return setErr(r.error ?? "Failed"); setSel(new Set()); router.refresh(); });

  if (rows.length === 0) return <p className="py-6 text-center text-[14px] text-ink-3">No questions match these filters.</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className={secondaryBtn} onClick={() => setSel(sel.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)))}>
          {sel.size === rows.length ? "Clear selection" : "Select all on this page"}
        </button>
        <button className={primaryBtn} disabled={!ids.length || pending} onClick={() => bulk(() => setQuestionStatusAction(ids, "REVIEWED"))}>
          <Check className="h-4 w-4" />Mark reviewed ({ids.length})
        </button>
        <button className={secondaryBtn} disabled={!ids.length || pending} onClick={() => bulk(() => setQuestionStatusAction(ids, "DRAFT"))}>Back to draft</button>
        <button
          className="press inline-flex h-10 items-center gap-2 rounded-full border border-status-danger/40 px-5 text-[14px] font-semibold text-status-danger hover:bg-status-danger-bg disabled:opacity-60"
          disabled={!ids.length || pending}
          onClick={() => { if (confirm(`Delete ${ids.length} question(s)? This cannot be undone.`)) bulk(() => deleteQuestionsAction(ids)); }}
        >
          <Trash2 className="h-4 w-4" />Delete
        </button>
      </div>
      <ErrorLine msg={err} />
      <ul className="divide-y divide-line rounded-xl border border-line">
        {rows.map((q) => (
          <li key={q.id} className={"flex gap-3 p-3 " + (sel.has(q.id) ? "bg-primary-tint/50" : "")}>
            <input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0" checked={sel.has(q.id)} onChange={() => toggle(q.id)} aria-label="Select question" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-ink-2">Unit {q.unit}{q.topic ? ` · ${q.topic}` : ""}</span>
                <span className="rounded-full bg-primary-tint px-2 py-0.5 text-primary">{q.type}</span>
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-ink-2">{q.source.replace("_", " ").toLowerCase()}</span>
                <span className="text-ink-3">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
                {q.pastPaperRef && <span className="text-ink-3">{q.pastPaperRef}</span>}
                <span className={"rounded-full px-2 py-0.5 " + (q.status === "REVIEWED" ? "bg-status-success-bg text-status-success" : "bg-status-warning-bg text-status-warning")}>
                  {q.status === "REVIEWED" ? "Reviewed" : "Needs review"}
                </span>
              </div>
              <div className="grid gap-1 md:grid-cols-2 md:gap-4">
                {q.textEn && <p className="text-[15px] text-ink">{q.textEn}</p>}
                {q.textUr && <p className={`${urdu.className} text-[16px] leading-[2.1] text-ink`} dir="rtl">{q.textUr}</p>}
              </div>
              {q.options && (
                <ol className="mt-1 grid gap-x-4 gap-y-0.5 text-[14px] text-ink-2 sm:grid-cols-2">
                  {q.options.map((o, i) => (
                    <li key={i} className={String(i) === q.answer ? "font-semibold text-status-success" : ""}>
                      ({"abcd"[i]}) {o.en}{o.en && o.ur ? " / " : ""}<span className={urdu.className} dir="rtl">{o.ur}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <button aria-label="Edit question" className="h-8 w-8 shrink-0 rounded-full p-1.5 text-ink-3 hover:bg-surface-sunken hover:text-ink" onClick={() => setEditing(q)}>
              <Pencil className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <EditDialog q={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />
    </div>
  );
}

function EditDialog({ q, onClose, onSaved }: { q: AdminQuestion | null; onClose: () => void; onSaved: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState<AdminQuestion | null>(null);
  if (q && (!f || f.id !== q.id)) setF({ ...q, options: q.options ? q.options.map((o) => ({ ...o })) : null });
  if (!q || !f) return null;
  const area = `${fieldClass} h-auto min-h-[72px] py-2`;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) { onClose(); setF(null); setErr(null); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit question</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await updateQuestionAction({ id: f.id, textEn: f.textEn ?? "", textUr: f.textUr ?? "", options: f.options ?? undefined, answer: f.answer ?? "", marks: f.marks });
              if (!r.ok) return setErr(r.error);
              setF(null);
              onSaved();
            });
          }}
        >
          <div>
            <label className={label}>Question (English)</label>
            <textarea className={area} value={f.textEn ?? ""} onChange={(e) => setF({ ...f, textEn: e.target.value })} />
          </div>
          <div>
            <label className={label}>Question (Urdu)</label>
            <textarea className={`${area} ${urdu.className} leading-[2.1]`} dir="rtl" value={f.textUr ?? ""} onChange={(e) => setF({ ...f, textUr: e.target.value })} />
          </div>
          {f.options && (
            <div className="grid gap-2">
              {f.options.map((o, i) => (
                <div key={i} className="grid grid-cols-[28px_1fr_1fr] items-center gap-2">
                  <input type="radio" name="ans" aria-label={`Option ${"ABCD"[i]} is correct`} checked={f.answer === String(i)} onChange={() => setF({ ...f, answer: String(i) })} />
                  <input className={fieldClass} value={o.en} placeholder={`Option ${"ABCD"[i]}`} onChange={(e) => { const opts = [...f.options!]; opts[i] = { ...o, en: e.target.value }; setF({ ...f, options: opts }); }} />
                  <input className={`${fieldClass} ${urdu.className}`} dir="rtl" value={o.ur} onChange={(e) => { const opts = [...f.options!]; opts[i] = { ...o, ur: e.target.value }; setF({ ...f, options: opts }); }} />
                </div>
              ))}
              <p className="text-[12px] text-ink-3">Select the circle next to the correct option.</p>
            </div>
          )}
          {!f.options && (
            <div>
              <label className={label}>Model answer (optional)</label>
              <textarea className={area} value={f.answer ?? ""} onChange={(e) => setF({ ...f, answer: e.target.value })} />
            </div>
          )}
          <div className="w-32">
            <label className={label}>Marks</label>
            <input className={fieldClass} inputMode="decimal" value={f.marks} onChange={(e) => setF({ ...f, marks: Number(e.target.value) || 0 })} />
          </div>
          <ErrorLine msg={err} />
          <div className="flex justify-end gap-2">
            <button type="button" className={secondaryBtn} onClick={() => { onClose(); setF(null); }}>Cancel</button>
            <button className={primaryBtn} disabled={pending}>{pending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
