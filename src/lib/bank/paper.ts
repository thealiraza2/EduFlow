/**
 * Paper builder: section shapes, question selection and the marks wording that
 * appears on the printed paper. Pure functions, no database.
 */
import type { BankType } from "./csv";

export interface PaperSection {
  id: string;
  type: BankType;
  /** Questions the student must attempt. */
  required: number;
  marksEach: number;
  /** Question ids printed in this section (required + choice). */
  questionIds: string[];
}

export interface PaperSettings {
  schoolName: string;
  examTitle: string;
  showAnswerKey: boolean;
  fontScale: number;
}

export interface SectionRequest {
  type: BankType;
  total: number;
  required: number;
  marksEach: number;
}

export interface Candidate {
  id: string;
  type: BankType;
  unitId: string;
}

export const sectionMarks = (s: Pick<PaperSection, "required" | "marksEach">) => s.required * s.marksEach;
export const paperMarks = (sections: Pick<PaperSection, "required" | "marksEach">[]) =>
  sections.reduce((n, s) => n + sectionMarks(s), 0);

/** Fisher–Yates with an injectable random source (tests pass a seeded one). */
export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks `count` questions spread evenly over units: shuffle each unit's pool,
 * then take round-robin across units in a shuffled unit order.
 */
export function pickSpread(pool: Candidate[], count: number, exclude: Set<string>, rand: () => number = Math.random): string[] {
  const byUnit = new Map<string, string[]>();
  for (const q of pool) {
    if (exclude.has(q.id)) continue;
    const list = byUnit.get(q.unitId) ?? [];
    list.push(q.id);
    byUnit.set(q.unitId, list);
  }
  const queues = shuffle([...byUnit.values()].map((l) => shuffle(l, rand)), rand);
  const out: string[] = [];
  while (out.length < count && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (out.length >= count) break;
      const id = q.shift();
      if (id) out.push(id);
    }
  }
  return out;
}

export function buildSections(
  requests: SectionRequest[],
  pool: Candidate[],
  rand: () => number = Math.random,
): { sections: PaperSection[]; shortfalls: { type: BankType; wanted: number; found: number }[] } {
  const used = new Set<string>();
  const shortfalls: { type: BankType; wanted: number; found: number }[] = [];
  const sections = requests.map((r, i) => {
    const ids = pickSpread(pool.filter((q) => q.type === r.type), r.total, used, rand);
    ids.forEach((id) => used.add(id));
    if (ids.length < r.total) shortfalls.push({ type: r.type, wanted: r.total, found: ids.length });
    return {
      id: `s${i + 1}`,
      type: r.type,
      required: r.type === "MCQ" ? ids.length : Math.min(r.required, ids.length),
      marksEach: r.marksEach,
      questionIds: ids,
    };
  });
  return { sections, shortfalls };
}

/**
 * Students attempt every printed MCQ, so an MCQ section's `required` always equals
 * its question count. Papers saved before this rule may say otherwise; this fixes them.
 */
export function normalizeSections<T extends Pick<PaperSection, "type" | "required" | "questionIds">>(sections: T[]): T[] {
  return sections.map((s) => (s.type === "MCQ" && s.required !== s.questionIds.length ? { ...s, required: s.questionIds.length } : s));
}

/** Lower-case Roman numeral for short-question numbering: 1 → "i", 24 → "xxiv". */
export function toRoman(n: number): string {
  const table: [number, string][] = [[100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let out = "";
  for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Section heading in English and Urdu, e.g. "Answer any 5 of the following 8 questions. (5 × 2 = 10)". */
export function sectionHeading(s: Pick<PaperSection, "type" | "required" | "marksEach" | "questionIds">) {
  const total = s.questionIds.length;
  const formula = `(${s.required} × ${s.marksEach} = ${sectionMarks(s)})`;
  const choice = s.required < total;
  if (s.type === "MCQ") {
    return {
      en: `Choose the correct answer. ${formula}`,
      ur: "درست جواب کا انتخاب کریں۔",
    };
  }
  if (s.type === "SHORT") {
    return {
      en: choice ? `Answer any ${s.required} of the following ${total} questions briefly. ${formula}` : `Answer the following questions briefly. ${formula}`,
      ur: choice ? `مندرجہ ذیل میں سے کوئی سے ${s.required} سوالات کے مختصر جوابات لکھیں۔` : "مندرجہ ذیل سوالات کے مختصر جوابات لکھیں۔",
    };
  }
  return {
    en: choice ? `Attempt any ${s.required} of the following ${total} questions in detail. ${formula}` : `Attempt the following questions in detail. ${formula}`,
    ur: choice ? `کوئی سے ${s.required} سوالات کے تفصیلی جوابات لکھیں۔` : "مندرجہ ذیل سوالات کے تفصیلی جوابات لکھیں۔",
  };
}

export const DEFAULT_SETTINGS: PaperSettings = {
  schoolName: "",
  examTitle: "",
  showAnswerKey: false,
  fontScale: 1,
};
