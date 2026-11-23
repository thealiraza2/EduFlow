/**
 * Question-bank CSV import: parsing and row validation (pure, no database).
 *
 * Expected columns (header row, any order, case-insensitive):
 *   unit, unit_title, topic, topic_title, type, source,
 *   question_en, question_ur,
 *   a_en, a_ur, b_en, b_ur, c_en, c_ur, d_en, d_ur,
 *   answer, marks, past_paper
 * Only unit, type and one of question_en / question_ur are required.
 */

export type BankType = "MCQ" | "SHORT" | "LONG";
export type BankSource = "EXERCISE" | "PAST_PAPER" | "ADDITIONAL" | "CONCEPTUAL";

export interface ParsedQuestionRow {
  line: number;
  unitNumber: number;
  unitTitle?: string;
  topicCode?: string;
  topicTitle?: string;
  type: BankType;
  source: BankSource;
  textEn?: string;
  textUr?: string;
  options?: { en: string; ur: string }[];
  answer?: string;
  marks: number;
  pastPaperRef?: string;
}

export interface CsvParseResult {
  rows: ParsedQuestionRow[];
  errors: { line: number; message: string }[];
}

export const CSV_HEADERS = [
  "unit", "unit_title", "topic", "topic_title", "type", "source",
  "question_en", "question_ur",
  "a_en", "a_ur", "b_en", "b_ur", "c_en", "c_ur", "d_en", "d_ur",
  "answer", "marks", "past_paper",
] as const;

const DEFAULT_MARKS: Record<BankType, number> = { MCQ: 1, SHORT: 2, LONG: 5 };

/** RFC 4180-style CSV parser: quoted fields, escaped quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function normType(v: string): BankType | null {
  const s = v.trim().toUpperCase();
  if (["MCQ", "MCQS", "OBJECTIVE", "M"].includes(s)) return "MCQ";
  if (["SHORT", "SQ", "S", "SHORT QUESTION"].includes(s)) return "SHORT";
  if (["LONG", "LQ", "L", "LONG QUESTION"].includes(s)) return "LONG";
  return null;
}

function normSource(v: string): BankSource | null {
  const s = v.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (s === "") return "EXERCISE";
  if (["EXERCISE", "EX", "BOOK"].includes(s)) return "EXERCISE";
  if (["PAST_PAPER", "PAST_PAPERS", "PAST", "BOARD"].includes(s)) return "PAST_PAPER";
  if (["ADDITIONAL", "EXTRA"].includes(s)) return "ADDITIONAL";
  if (["CONCEPTUAL", "CONCEPT"].includes(s)) return "CONCEPTUAL";
  return null;
}

export function parseQuestionCsv(text: string, maxRows = 3000): CsvParseResult {
  const table = parseCsv(text);
  const errors: CsvParseResult["errors"] = [];
  if (table.length === 0) return { rows: [], errors: [{ line: 1, message: "The file is empty." }] };

  const header = table[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  for (const required of ["unit", "type"]) {
    if (col(required) < 0) errors.push({ line: 1, message: `Missing column "${required}".` });
  }
  if (col("question_en") < 0 && col("question_ur") < 0) errors.push({ line: 1, message: 'Need a "question_en" or "question_ur" column.' });
  if (errors.length) return { rows: [], errors };
  if (table.length - 1 > maxRows) return { rows: [], errors: [{ line: 1, message: `Too many rows (${table.length - 1}). Import at most ${maxRows} at a time.` }] };

  const get = (r: string[], name: string) => { const i = col(name); return i >= 0 ? (r[i] ?? "").trim() : ""; };
  const rows: ParsedQuestionRow[] = [];

  table.slice(1).forEach((r, idx) => {
    const line = idx + 2;
    const fail = (message: string) => errors.push({ line, message });

    const unitNumber = Number.parseInt(get(r, "unit"), 10);
    if (!Number.isFinite(unitNumber) || unitNumber < 1) return fail("unit must be a number like 1, 2, 3.");
    const type = normType(get(r, "type"));
    if (!type) return fail(`type "${get(r, "type")}" is not MCQ, SHORT or LONG.`);
    const source = normSource(get(r, "source"));
    if (!source) return fail(`source "${get(r, "source")}" is not exercise, past_paper, additional or conceptual.`);
    const textEn = get(r, "question_en") || undefined;
    const textUr = get(r, "question_ur") || undefined;
    if (!textEn && !textUr) return fail("question_en or question_ur is required.");

    let options: ParsedQuestionRow["options"];
    let answer: string | undefined;
    if (type === "MCQ") {
      options = ["a", "b", "c", "d"].map((k) => ({ en: get(r, `${k}_en`), ur: get(r, `${k}_ur`) }));
      if (options.some((o) => !o.en && !o.ur)) return fail("MCQ needs all four options (a, b, c, d) in English or Urdu.");
      const a = get(r, "answer").toUpperCase();
      const ai = ["A", "B", "C", "D"].indexOf(a);
      if (ai < 0) return fail(`MCQ answer must be A, B, C or D (got "${get(r, "answer")}").`);
      answer = String(ai);
    } else {
      answer = get(r, "answer") || undefined;
    }

    const marksRaw = get(r, "marks");
    const marks = marksRaw === "" ? DEFAULT_MARKS[type] : Number(marksRaw);
    if (!Number.isFinite(marks) || marks <= 0 || marks > 50) return fail(`marks "${marksRaw}" is not a valid number.`);

    rows.push({
      line, unitNumber, type, source, textEn, textUr, options, answer, marks,
      unitTitle: get(r, "unit_title") || undefined,
      topicCode: get(r, "topic") || undefined,
      topicTitle: get(r, "topic_title") || undefined,
      pastPaperRef: get(r, "past_paper") || undefined,
    });
  });

  return { rows, errors };
}

/** Header + two sample rows; prefixed with a BOM so Excel opens the Urdu correctly. */
export function csvTemplate(): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [
    [...CSV_HEADERS],
    ["1", "Physical Quantities and Measurement", "1.1", "Physical quantities", "MCQ", "exercise",
      "The SI unit of length is:", "لمبائی کا ایس آئی یونٹ ہے:",
      "metre", "میٹر", "foot", "فٹ", "inch", "انچ", "mile", "میل", "A", "1", ""],
    ["1", "", "1.2", "Measuring instruments", "SHORT", "past_paper",
      "What is the least count of a vernier callipers?", "ورنیئر کیلی پرز کا لیسٹ کاؤنٹ کیا ہے؟",
      "", "", "", "", "", "", "", "", "", "2", "BISE Lahore 2024"],
  ];
  return "﻿" + lines.map((l) => l.map(esc).join(",")).join("\r\n") + "\r\n";
}
