"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, RefreshCw, Save, Shuffle, Trash2, X } from "@/components/icons";
import { deletePaperAction, replaceQuestionsAction, savePaperAction } from "@/lib/actions/papers";
import { paperMarks, sectionHeading, shuffle, type PaperSection, type PaperSettings } from "@/lib/bank/paper";
import { urdu } from "@/lib/fonts/urdu";

export type EditorQuestion = {
  id: string; type: "MCQ" | "SHORT" | "LONG"; textEn: string | null; textUr: string | null;
  options: { en: string; ur: string }[] | null; answer: string | null;
};
type Lang = "en" | "ur" | "dual";
type Paper = { id: string; title: string; className: string; subject: string; timeMinutes: number | null; language: Lang; sections: PaperSection[]; settings: PaperSettings };

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx"];
const tool = "press inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink hover:bg-surface-sunken disabled:opacity-50";

export function PaperEditor({ paper, questions, shortfall }: { paper: Paper; questions: EditorQuestion[]; shortfall: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(paper.title);
  const [time, setTime] = useState(paper.timeMinutes ? String(paper.timeMinutes) : "");
  const [lang, setLang] = useState<Lang>(paper.language);
  const [sections, setSections] = useState(paper.sections);
  const [settings, setSettings] = useState(paper.settings);
  const [bank, setBank] = useState(() => new Map(questions.map((q) => [q.id, q])));
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(shortfall ? `Not enough reviewed questions for: ${shortfall.replace(/,/g, ", ")} (found / wanted). The paper uses what was available.` : null);

  const total = paperMarks(sections);
  const touch = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setDirty(true); };
  const updateSection = (id: string, patch: Partial<PaperSection>) => { setSections((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x))); setDirty(true); };

  const save = () =>
    start(async () => {
      const r = await savePaperAction({ id: paper.id, title, timeMinutes: time ? Number(time) : null, language: lang, sections, settings: settings as PaperSettings & Record<string, unknown> });
      setMsg(r.ok ? "Saved." : r.error);
      if (r.ok) setDirty(false);
    });

  const replace = (section: PaperSection, ids: string[]) =>
    start(async () => {
      const keep = sections.flatMap((s) => s.questionIds).filter((id) => !ids.includes(id));
      const r = await replaceQuestionsAction({ paperId: paper.id, sectionId: section.id, replaceIds: ids, keepIds: keep });
      if (!r.ok) return setMsg(r.error);
      const fresh = r.data!.questions;
      setBank((b) => { const n = new Map(b); fresh.forEach((q) => n.set(q.id, q)); return n; });
      let k = 0;
      updateSection(section.id, { questionIds: section.questionIds.map((id) => (ids.includes(id) && k < fresh.length ? fresh[k++].id : id)) });
    });

  let qNo = 0;
  const dir = lang === "ur" ? "rtl" : "ltr";

  const Text = ({ en, ur, className = "" }: { en: string | null; ur: string | null; className?: string }) => {
    if (lang === "en") return <span className={className}>{en || ur}</span>;
    if (lang === "ur") return <span className={`${urdu.className} ${className}`} dir="rtl">{ur || en}</span>;
    return (
      <span className={`grid grid-cols-2 gap-4 ${className}`}>
        <span>{en}</span>
        <span className={`${urdu.className} text-right`} dir="rtl">{ur}</span>
      </span>
    );
  };

  const answers = useMemo(
    () => sections.filter((s) => s.type === "MCQ").flatMap((s) => s.questionIds.map((id) => bank.get(id))).filter(Boolean) as EditorQuestion[],
    [sections, bank],
  );

  return (
    <div className="space-y-4">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body * { visibility: hidden !important; }
          #paper-sheet, #paper-sheet * { visibility: visible !important; }
          #paper-sheet { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .answer-page { break-before: page; }
        }
      `}</style>

      <div className="no-print flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-1 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/teacher/papers" className={tool}><ArrowLeft className="h-4 w-4" />Papers</Link>
          <input aria-label="Paper title" className="h-9 min-w-[180px] flex-1 rounded-xl border border-line-strong px-3 text-[15px] font-semibold" value={title} onChange={(e) => touch(setTitle)(e.target.value)} />
          <button className={tool} onClick={save} disabled={pending}><Save className="h-4 w-4" />{pending ? "Saving…" : dirty ? "Save" : "Saved"}</button>
          <button className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />Print / PDF
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          <div className="flex items-center gap-1">
            {(["en", "ur", "dual"] as Lang[]).map((l) => (
              <button key={l} onClick={() => touch(setLang)(l)} className={"rounded-full px-3 py-1 font-semibold " + (lang === l ? "bg-primary text-white" : "bg-surface-sunken text-ink-2")}>
                {l === "en" ? "English" : l === "ur" ? "Urdu" : "Dual"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2">School
            <input className="h-8 w-48 rounded-lg border border-line-strong px-2" value={settings.schoolName} onChange={(e) => touch(setSettings)({ ...settings, schoolName: e.target.value })} />
          </label>
          <label className="flex items-center gap-2">Time
            <input className="h-8 w-16 rounded-lg border border-line-strong px-2" inputMode="numeric" value={time} onChange={(e) => touch(setTime)(e.target.value)} /> min
          </label>
          <label className="flex items-center gap-2">Text size
            <input type="range" min={0.85} max={1.25} step={0.05} value={settings.fontScale} onChange={(e) => touch(setSettings)({ ...settings, fontScale: Number(e.target.value) })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.showAnswerKey} onChange={(e) => touch(setSettings)({ ...settings, showAnswerKey: e.target.checked })} /> Answer key page
          </label>
          <button
            className="ml-auto inline-flex items-center gap-1 font-semibold text-status-danger"
            onClick={() => { if (confirm("Delete this paper?")) start(async () => { await deletePaperAction(paper.id); router.push("/teacher/papers"); }); }}
          >
            <Trash2 className="h-4 w-4" />Delete
          </button>
        </div>
        {msg && <p className="flex items-start justify-between gap-2 rounded-xl bg-surface-sunken px-3 py-2 text-[13.5px] text-ink-2">{msg}<button aria-label="Dismiss" onClick={() => setMsg(null)}><X className="h-4 w-4" /></button></p>}
      </div>

      <div className="overflow-x-auto pb-6">
        <div
          id="paper-sheet"
          dir={dir}
          className="mx-auto w-[210mm] min-h-[297mm] bg-white px-[14mm] py-[12mm] text-black shadow-2"
          style={{ fontSize: `${(11.5 * settings.fontScale).toFixed(2)}pt`, lineHeight: 1.45 }}
        >
          <header className="border-b-2 border-black pb-2 text-center">
            <p className="text-[1.6em] font-bold leading-tight">{settings.schoolName || "School name"}</p>
            <p className="text-[1.1em] font-semibold">{title}</p>
          </header>
          <table className="mt-2 w-full border-collapse text-[0.95em]" dir="ltr">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1">Name: ____________________</td>
                <td className="border border-black px-2 py-1">Roll no: ________</td>
                <td className="border border-black px-2 py-1">Class: {paper.className}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1">Subject: {paper.subject}</td>
                <td className="border border-black px-2 py-1">Total marks: {total}</td>
                <td className="border border-black px-2 py-1">Time: {time ? `${time} min` : "______"}</td>
              </tr>
            </tbody>
          </table>

          {sections.map((s) => {
            qNo += 1;
            const h = sectionHeading(s);
            return (
              <section key={s.id} className="group mt-4">
                <div className="flex items-start justify-between gap-3 font-bold">
                  <p className="min-w-0 flex-1">
                    <span className="mr-1">Q.{qNo}</span>
                    {lang !== "ur" && <span>{h.en}</span>}
                    {lang === "dual" && <span className={`${urdu.className} block text-right font-normal`} dir="rtl">{h.ur}</span>}
                    {lang === "ur" && <span className={urdu.className}>{h.ur} ({s.required} × {s.marksEach} = {s.required * s.marksEach})</span>}
                  </p>
                </div>

                <div className="no-print my-1 flex flex-wrap items-center gap-2 rounded-lg bg-primary-tint/60 px-2 py-1 text-[12.5px] text-ink" dir="ltr">
                  <span className="font-semibold">Attempt</span>
                  <input className="h-7 w-12 rounded border border-line-strong px-1" inputMode="numeric" value={s.required}
                    onChange={(e) => updateSection(s.id, { required: Math.max(0, Math.min(s.questionIds.length, Number(e.target.value) || 0)) })} />
                  <span>of {s.questionIds.length}</span>
                  <span className="ml-2 font-semibold">Marks each</span>
                  <input className="h-7 w-14 rounded border border-line-strong px-1" inputMode="decimal" value={s.marksEach}
                    onChange={(e) => updateSection(s.id, { marksEach: Number(e.target.value) || 0 })} />
                  <button className="ml-auto inline-flex items-center gap-1 font-semibold text-primary" onClick={() => updateSection(s.id, { questionIds: shuffle(s.questionIds) })}><Shuffle className="h-3.5 w-3.5" />Shuffle</button>
                  <button className="inline-flex items-center gap-1 font-semibold text-primary" disabled={pending} onClick={() => replace(s, s.questionIds)}><RefreshCw className="h-3.5 w-3.5" />New questions</button>
                </div>

                {s.type === "MCQ" ? (
                  <ol className="mt-1 space-y-1.5">
                    {s.questionIds.map((id, i) => {
                      const q = bank.get(id);
                      if (!q) return null;
                      return (
                        <li key={id} className="group/q relative">
                          <div className="flex gap-2">
                            <span className="w-6 shrink-0">{i + 1}.</span>
                            <Text en={q.textEn} ur={q.textUr} className="flex-1" />
                          </div>
                          <div className="ml-8 mt-0.5 grid grid-cols-4 gap-x-3 text-[0.95em]">
                            {(q.options ?? []).map((o, j) => (
                              <span key={j} className="min-w-0">
                                ({"abcd"[j]}) {lang === "ur" ? <span className={urdu.className}>{o.ur || o.en}</span> : lang === "en" ? (o.en || o.ur) : <>{o.en}{o.en && o.ur ? " " : ""}<span className={urdu.className} dir="rtl">{o.ur}</span></>}
                              </span>
                            ))}
                          </div>
                          <QuestionTools onSwap={() => replace(s, [id])} onRemove={() => updateSection(s.id, { questionIds: s.questionIds.filter((x) => x !== id), required: Math.min(s.required, s.questionIds.length - 1) })} />
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <ol className="mt-1 space-y-1.5">
                    {s.questionIds.map((id, i) => {
                      const q = bank.get(id);
                      if (!q) return null;
                      return (
                        <li key={id} className="group/q relative flex gap-2">
                          <span className="w-8 shrink-0">{s.type === "SHORT" ? `(${ROMAN[i] ?? i + 1})` : `${i + 1}.`}</span>
                          <Text en={q.textEn} ur={q.textUr} className="flex-1" />
                          <QuestionTools onSwap={() => replace(s, [id])} onRemove={() => updateSection(s.id, { questionIds: s.questionIds.filter((x) => x !== id), required: Math.min(s.required, s.questionIds.length - 1) })} />
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            );
          })}

          {settings.showAnswerKey && answers.length > 0 && (
            <section className="answer-page mt-8 border-t-2 border-dashed border-black pt-3" dir="ltr">
              <p className="font-bold">Answer key: MCQs</p>
              <p className="mt-1 grid grid-cols-6 gap-1 text-[0.95em]">
                {answers.map((q, i) => <span key={q.id}>{i + 1}. {q.answer !== null && q.answer !== "" ? "abcd"[Number(q.answer)] ?? "-" : "-"}</span>)}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionTools({ onSwap, onRemove }: { onSwap: () => void; onRemove: () => void }) {
  return (
    <span className="no-print absolute right-0 top-0 flex gap-1 rounded-full bg-white/90 p-0.5 shadow-1 sm:hidden sm:group-hover/q:flex" dir="ltr">
      <button title="Swap for another question" className="rounded-full bg-primary-tint p-1 text-primary hover:bg-primary hover:text-white" onClick={onSwap}><RefreshCw className="h-3.5 w-3.5" /></button>
      <button title="Remove question" className="rounded-full bg-status-danger-bg p-1 text-status-danger hover:bg-status-danger hover:text-white" onClick={onRemove}><X className="h-3.5 w-3.5" /></button>
    </span>
  );
}
