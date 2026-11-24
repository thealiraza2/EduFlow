"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel, EmptyState } from "@/components/dashboard/kit";
import { Library, Plus, Sparkles, Trash2 } from "@/components/icons";
import { generatePaperAction } from "@/lib/actions/papers";
import { urdu } from "@/lib/fonts/urdu";

type QType = "MCQ" | "SHORT" | "LONG";
type Source = "EXERCISE" | "PAST_PAPER" | "ADDITIONAL" | "CONCEPTUAL";

export type WizardBook = {
  id: string; className: string; subject: string; subjectUr: string | null; edition: string;
  units: { id: string; number: number; title: string; topics: { id: string; code: string; title: string }[]; counts: { type: QType; source: Source; n: number }[] }[];
};

type Row = { type: QType; total: number; required: number; marksEach: number };

const SOURCES: { id: Source; label: string }[] = [
  { id: "EXERCISE", label: "Book exercise" },
  { id: "PAST_PAPER", label: "Past papers" },
  { id: "ADDITIONAL", label: "Additional" },
  { id: "CONCEPTUAL", label: "Conceptual" },
];
const TYPE_LABEL: Record<QType, string> = { MCQ: "MCQs", SHORT: "Short questions", LONG: "Long questions" };
const PRESETS: { name: string; rows: Row[] }[] = [
  { name: "Chapter test (25)", rows: [{ type: "MCQ", total: 5, required: 5, marksEach: 1 }, { type: "SHORT", total: 6, required: 4, marksEach: 2 }, { type: "LONG", total: 2, required: 1, marksEach: 12 }] },
  { name: "Monthly test (50)", rows: [{ type: "MCQ", total: 10, required: 10, marksEach: 1 }, { type: "SHORT", total: 12, required: 8, marksEach: 2 }, { type: "LONG", total: 3, required: 2, marksEach: 12 }] },
  { name: "MCQs only (20)", rows: [{ type: "MCQ", total: 20, required: 20, marksEach: 1 }] },
];

const chip = (on: boolean) =>
  "press rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors " + (on ? "border-primary bg-primary text-white" : "border-line-strong bg-surface text-ink hover:bg-surface-sunken");
const field = "h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px] text-ink focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

export function PaperWizard({ books }: { books: WizardBook[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const classes = [...new Set(books.map((b) => b.className))];
  const [cls, setCls] = useState(classes[0] ?? "");
  const [bookId, setBookId] = useState<string>("");
  const [units, setUnits] = useState<Set<string>>(new Set());
  // All sources start selected so every reviewed question counts; teachers narrow it down if they want.
  const [sources, setSources] = useState<Set<Source>>(new Set(["EXERCISE", "PAST_PAPER", "ADDITIONAL", "CONCEPTUAL"]));
  const [rows, setRows] = useState<Row[]>(PRESETS[1].rows);
  const [title, setTitle] = useState("Monthly test");
  const [time, setTime] = useState("60");
  const [language, setLanguage] = useState<"en" | "ur" | "dual">("dual");
  const [err, setErr] = useState<string | null>(null);

  const book = books.find((b) => b.id === bookId);
  const available = useMemo(() => {
    const out: Record<QType, number> = { MCQ: 0, SHORT: 0, LONG: 0 };
    book?.units.filter((u) => units.has(u.id)).forEach((u) => u.counts.forEach((c) => { if (sources.has(c.source)) out[c.type] += c.n; }));
    return out;
  }, [book, units, sources]);
  const total = rows.reduce((n, r) => n + r.required * r.marksEach, 0);

  if (books.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title="The question bank is being filled"
        body="Books and questions are added by the EduFlow team. As soon as the first book is reviewed, you can build papers here."
      />
    );
  }

  const pickBook = (id: string) => { setBookId(id); setUnits(new Set()); };
  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const submit = () => {
    setErr(null);
    if (!book) return setErr("Choose a subject first.");
    start(async () => {
      const r = await generatePaperAction({
        bookId: book.id, unitIds: [...units], sources: [...sources], title, language,
        timeMinutes: time ? Number(time) : undefined, sections: rows,
      });
      if (!r.ok) return setErr(r.error);
      const short = r.data!.shortfalls;
      const q = short.length ? `?short=${encodeURIComponent(short.map((s) => `${s.type}:${s.found}/${s.wanted}`).join(","))}` : "";
      router.push(`/teacher/papers/${r.data!.id}${q}`);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
      <div className="space-y-6">
        <Panel title="1. Class and subject">
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => <button key={c} className={chip(cls === c)} onClick={() => { setCls(c); setBookId(""); }}>Class {c}</button>)}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {books.filter((b) => b.className === cls).map((b) => (
              <button
                key={b.id}
                onClick={() => pickBook(b.id)}
                className={"rounded-2xl border p-4 text-left transition-colors " + (bookId === b.id ? "border-primary bg-primary-tint" : "border-line bg-surface hover:border-line-strong")}
              >
                <p className="text-[16px] font-bold text-ink">{b.subject}</p>
                {b.subjectUr && <p className={`${urdu.className} text-[15px] text-ink-2`} dir="rtl">{b.subjectUr}</p>}
                <p className="mt-1 text-[12.5px] text-ink-3">{b.edition}</p>
              </button>
            ))}
          </div>
        </Panel>

        {book && (
          <Panel
            title="2. Chapters"
            description="Only questions from these chapters will be used."
            action={
              <button className="text-[13px] font-semibold text-primary" onClick={() => setUnits(units.size === book.units.length ? new Set() : new Set(book.units.map((u) => u.id)))}>
                {units.size === book.units.length ? "Clear" : "Select all"}
              </button>
            }
          >
            {book.units.length === 0 ? (
              <p className="text-[14px] text-ink-3">This book has no chapters yet.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {book.units.map((u) => {
                  const n = u.counts.filter((c) => sources.has(c.source)).reduce((a, c) => a + c.n, 0);
                  return (
                    <li key={u.id}>
                      <label className={"flex cursor-pointer items-start gap-3 rounded-xl border p-3 " + (units.has(u.id) ? "border-primary bg-primary-tint/60" : "border-line")}>
                        <input
                          type="checkbox" className="mt-1 h-4 w-4" checked={units.has(u.id)}
                          onChange={() => setUnits((s) => { const x = new Set(s); if (x.has(u.id)) x.delete(u.id); else x.add(u.id); return x; })}
                        />
                        <span className="min-w-0">
                          <span className="block text-[14.5px] font-semibold text-ink">Unit {u.number}: {u.title}</span>
                          <span className="text-[12.5px] text-ink-3">{n} ready questions</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        )}

        {book && (
          <Panel title="3. Question sources">
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <button key={s.id} className={chip(sources.has(s.id))} onClick={() => setSources((x) => { const n = new Set(x); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })}>
                  {s.label}
                </button>
              ))}
            </div>
          </Panel>
        )}

        {book && (
          <Panel title="4. Sections" description="How many questions to print, how many students must attempt, and marks for each.">
            <div className="mb-4 flex flex-wrap gap-2">
              {PRESETS.map((p) => <button key={p.name} className={chip(false)} onClick={() => setRows(p.rows)}>{p.name}</button>)}
            </div>
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-2 items-end gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
                  <label className="col-span-2 sm:col-span-1">
                    <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Type</span>
                    <select className={field} value={r.type} onChange={(e) => setRow(i, { type: e.target.value as QType })}>
                      {(Object.keys(TYPE_LABEL) as QType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                    </select>
                    <span className={"mt-1 block text-[12px] " + (available[r.type] < r.total ? "text-status-danger" : "text-ink-3")}>{available[r.type]} available</span>
                  </label>
                  <label>
                    <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Print</span>
                    <input className={field} inputMode="numeric" value={r.total} onChange={(e) => setRow(i, { total: Number(e.target.value) || 0 })} />
                  </label>
                  <label>
                    <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Attempt</span>
                    <input className={field} inputMode="numeric" value={r.required} onChange={(e) => setRow(i, { required: Number(e.target.value) || 0 })} />
                  </label>
                  <label>
                    <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Marks each</span>
                    <input className={field} inputMode="decimal" value={r.marksEach} onChange={(e) => setRow(i, { marksEach: Number(e.target.value) || 0 })} />
                  </label>
                  <button aria-label="Remove section" className="mb-1 justify-self-end rounded-full p-2 text-ink-3 hover:bg-status-danger-bg hover:text-status-danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {rows.length < 6 && (
              <button className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary" onClick={() => setRows([...rows, { type: "SHORT", total: 6, required: 4, marksEach: 2 }])}>
                <Plus className="h-4 w-4" /> Add section
              </button>
            )}
          </Panel>
        )}
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Panel title="Paper details">
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Title</span>
              <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Time (minutes)</span>
              <input className={field} inputMode="numeric" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <div>
              <span className="mb-1 block text-[12.5px] font-semibold text-ink-2">Language</span>
              <div className="flex gap-2">
                {([["en", "English"], ["ur", "اردو"], ["dual", "Dual"]] as const).map(([v, l]) => (
                  <button key={v} className={chip(language === v) + (v === "ur" ? ` ${urdu.className}` : "")} onClick={() => setLanguage(v)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-surface-sunken p-3 text-[14px]">
              <div className="flex justify-between"><span className="text-ink-2">Book</span><span className="font-semibold text-ink">{book ? `${book.className} ${book.subject}` : "Not chosen"}</span></div>
              <div className="flex justify-between"><span className="text-ink-2">Chapters</span><span className="font-semibold text-ink">{units.size}</span></div>
              <div className="mt-1 flex justify-between border-t border-line pt-1"><span className="text-ink-2">Total marks</span><span className="font-serif text-[20px] font-bold text-ink">{total}</span></div>
            </div>
            {err && <p role="alert" className="text-[14px] font-medium text-status-danger">{err}</p>}
            <button
              className="press inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              disabled={pending || !book || units.size === 0}
              onClick={submit}
            >
              <Sparkles className="h-4 w-4" />{pending ? "Building…" : "Generate paper"}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
