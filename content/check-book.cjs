// Checks one book folder after new question files were added, against the version on
// the base branch (default: the merge-base of HEAD and origin/main).
//
// Usage: node content/check-book.cjs content/<book-folder> [--target 20,15,4] [--base <git-ref>] [--write-overlaps]
//
// Fails (exit 1) when:
//   - any file other than zzz-exercise.cjs / zzzzz-extra.cjs / exercise-overlaps.md
//     changed in this folder, or any shared content script changed;
//   - any existing question row changed, moved or disappeared (ids are positional);
//   - a row in zzz-exercise.cjs is not source EXERCISE or has no "// p.<page>" comment;
//   - a row in zzzzz-extra.cjs is not source ADDITIONAL;
//   - a row is malformed (unknown topic, MCQ without 4 options or a valid answer, empty text);
//   - an extra (ADDITIONAL) question repeats any other question in the chapter;
//   - a chapter is below the target after removing old questions that overlap the exercise set.
// Prints near-duplicate pairs that need a human look as WARN; they do not fail the check.
// --write-overlaps writes <folder>/exercise-overlaps.md (old questions that repeat a book question).
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const args = process.argv.slice(2);
const dir = path.resolve(args[0] || "");
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const [TM, TS, TL] = opt("--target", "20,15,4").split(",").map(Number);
const writeOverlaps = args.includes("--write-overlaps");
if (!args[0] || !fs.existsSync(path.join(dir, "book.json"))) {
  console.error("Usage: node content/check-book.cjs content/<book-folder> [--target 20,15,4] [--base <ref>] [--write-overlaps]");
  process.exit(2);
}

const EXERCISE_FILE = "zzz-exercise.cjs";
const EXTRA_FILE = "zzzzz-extra.cjs";
const ALLOWED_NEW = new Set([EXERCISE_FILE, EXTRA_FILE, "exercise-overlaps.md"]);
const SHARED = ["content/load.cjs", "content/build-sql.cjs", "content/build-batch.cjs", "content/urdu-extra.cjs", "content/check-book.cjs"];

const repo = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const git = (...a) => execFileSync("git", a, { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const base = opt("--base", null) || git("merge-base", "HEAD", "origin/main").trim();
const rel = path.relative(repo, dir).split(path.sep).join("/");
const errors = [];
const warns = [];

// 1. Which files changed (committed or not) compared with the base.
const changed = git("diff", "--name-only", base, "--", rel, ...SHARED).split("\n").filter(Boolean);
const untracked = git("ls-files", "--others", "--exclude-standard", "--", rel).split("\n").filter(Boolean);
for (const f of [...new Set([...changed, ...untracked])]) {
  const inFolder = f.startsWith(rel + "/") && !f.slice(rel.length + 1).includes("/");
  const name = path.posix.basename(f);
  const existedBefore = git("ls-tree", "--name-only", base, "--", f).trim() !== "";
  if (!inFolder || !ALLOWED_NEW.has(name) || existedBefore) errors.push(`File must not change: ${f}`);
}

// 2. Load rows per file, in the same order and with the same ids as build-sql.cjs.
const book = JSON.parse(fs.readFileSync(path.join(dir, "book.json"), "utf8"));
const slug = (c) => String(c).replace(/\./g, "_");
function loadRows(folder) {
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".cjs")).sort();
  const counters = {};
  const rows = [];
  const topics = new Map();
  const units = new Map();
  for (const f of files) {
    const mod = require(path.resolve(folder, f));
    for (const u of mod) {
      if (!units.has(u.unit)) units.set(u.unit, u.title || "");
      for (const t of u.topics || []) {
        if (!topics.has(u.unit)) topics.set(u.unit, new Set());
        topics.get(u.unit).add(t[0]);
      }
    }
    // Merge order inside a unit is file order, so per-file iteration gives build-sql's ids.
    for (const u of [...mod].sort((a, b) => a.unit - b.unit)) {
      for (const q of u.q) {
        const [kind, topic] = q;
        const k = `${u.unit}|${kind}|${topic}`;
        counters[k] = (counters[k] || 0) + 1;
        rows.push({ id: `${book.id}_u${u.unit}_t${slug(topic)}_${kind.toLowerCase()}${counters[k]}`, unit: u.unit, file: f, q, json: JSON.stringify(q) });
      }
    }
  }
  return { rows, topics, units };
}

// Base copy: the folder as it is at the base ref, in a temp folder next to content/ so
// relative requires such as ../urdu-extra.cjs still resolve.
const tmp = fs.mkdtempSync(path.join(path.dirname(dir), ".base-"));
let before;
try {
  for (const f of git("ls-tree", "--name-only", base, rel + "/").split("\n").filter(Boolean)) {
    fs.writeFileSync(path.join(tmp, path.posix.basename(f)), git("show", `${base}:${f}`));
  }
  before = loadRows(tmp);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
const after = loadRows(dir);

const afterById = new Map(after.rows.map((r) => [r.id, r]));
let changedRows = 0;
for (const r of before.rows) {
  const a = afterById.get(r.id);
  if (!a || a.json !== r.json) { changedRows++; if (changedRows <= 5) errors.push(`Existing row changed or missing: ${r.id}`); }
}
if (changedRows > 5) errors.push(`...and ${changedRows - 5} more existing rows changed`);
const beforeIds = new Set(before.rows.map((r) => r.id));
const added = after.rows.filter((r) => !beforeIds.has(r.id));

// 3. Row checks for the new rows.
const sourceOf = (q) => { const last = q[q.length - 1]; return last && typeof last === "object" && !Array.isArray(last) ? last.source : undefined; };
const exerciseSrc = fs.existsSync(path.join(dir, EXERCISE_FILE)) ? fs.readFileSync(path.join(dir, EXERCISE_FILE), "utf8").split("\n") : [];
const exerciseRowLines = exerciseSrc.filter((l) => /^\s*\[\s*"[MSL]"/.test(l));
const isNewExercise = !beforeIds.size || !before.rows.some((r) => r.file === EXERCISE_FILE);
for (const r of added) {
  const [kind, topic, en, ur] = r.q;
  const src = sourceOf(r.q);
  if (!["M", "S", "L"].includes(kind)) errors.push(`${r.id}: kind must be M, S or L`);
  if (!after.topics.get(r.unit)?.has(topic)) errors.push(`${r.id}: unknown topic ${topic} (use a topic from units.cjs)`);
  if (!String(en || "").trim() && !String(ur || "").trim()) errors.push(`${r.id}: empty question text`);
  if (kind === "M") {
    const options = r.q[4];
    if (!Array.isArray(options) || options.length !== 4) errors.push(`${r.id}: MCQ needs exactly 4 options`);
    else if (new Set(options.map((o) => JSON.stringify(o))).size !== 4) errors.push(`${r.id}: MCQ has repeated options`);
    if (!["A", "B", "C", "D"].includes(r.q[5])) errors.push(`${r.id}: MCQ answer must be A, B, C or D`);
  }
  if (kind === "L" && !(typeof r.q[4] === "number" && r.q[4] > 0)) errors.push(`${r.id}: long question needs marks as the 5th item`);
  if (r.file === EXERCISE_FILE && src !== "EXERCISE") errors.push(`${r.id}: rows in ${EXERCISE_FILE} must have { source: "EXERCISE" }`);
  if (r.file === EXTRA_FILE && src !== "ADDITIONAL") errors.push(`${r.id}: rows in ${EXTRA_FILE} must have { source: "ADDITIONAL" }`);
  if (![EXERCISE_FILE, EXTRA_FILE].includes(r.file)) errors.push(`${r.id}: new rows are only allowed in ${EXERCISE_FILE} or ${EXTRA_FILE}`);
}
if (isNewExercise) {
  const noPage = exerciseRowLines.filter((l) => !/\/\/\s*p\.\s*\d+/.test(l)).length;
  if (noPage) errors.push(`${EXERCISE_FILE}: ${noPage} question rows have no "// p.<page>" comment on the same line`);
}

// 4. Near-duplicates inside each chapter (question text, English and Urdu).
const STOP = new Set(("the a an of in to and is was what how did does for with by on as from his her their its this that which who why be are were it into under " +
  "write give describe explain define state name two three short note following مندرجہ ذیل کا کی کے ہے ہیں میں سے کو نے اور کیا کریں لکھیں ایک یہ وہ پر بھی تھا تھی تھے ہو جو کس کون").split(/\s+/));
const words = (s) => new Set(String(s || "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w)));
const sim = (a, b) => {
  const A = words(a), B = words(b);
  if (A.size < 2 || B.size < 2) return 0;
  let n = 0; A.forEach((w) => B.has(w) && n++);
  return n / Math.min(A.size, B.size);
};
const text = (r) => `${r.q[2] || ""} ${r.q[3] || ""}`;
const overlaps = [];
// Rows already hidden live (set to DRAFT by a script in content/sql/) do not count either.
const hidden = new Set();
const sqlDir = path.join(repo, "content", "sql");
if (fs.existsSync(sqlDir)) {
  for (const f of fs.readdirSync(sqlDir).filter((f) => f.endsWith(".sql"))) {
    const sql = fs.readFileSync(path.join(sqlDir, f), "utf8");
    if (!/SET\s+status\s*=\s*'DRAFT'/i.test(sql)) continue;
    for (const m of sql.matchAll(/'([^']+)'/g)) if (m[1].startsWith(book.id + "_u")) hidden.add(m[1]);
  }
}
const sqlHidden = new Set(hidden);
const hiddenBefore = sqlHidden.size;
for (const r of added) {
  for (const o of after.rows) {
    if (o === r || o.unit !== r.unit || o.q[0] !== r.q[0] || sqlHidden.has(o.id)) continue;
    if (added.includes(o) && o.id > r.id) continue; // each new/new pair once
    const s = sim(text(r), text(o));
    if (s < 0.6) continue;
    const sameText = text(r).trim() === text(o).trim();
    const label = `${r.id} ~ ${o.id} (${s.toFixed(2)})\n    new: ${text(r).trim()}\n    old: ${text(o).trim()}`;
    if (r.file === EXERCISE_FILE && !added.includes(o)) {
      if (s >= 0.75 || sameText) { overlaps.push({ r, o, s }); hidden.add(o.id); } else warns.push(`Check: does this old question repeat the book question?\n  ${label}`);
    } else if (r.file === EXTRA_FILE || o.file === EXTRA_FILE) {
      if (s >= 0.75 || sameText) errors.push(`Extra question repeats another question:\n  ${label}`); else warns.push(`Check: possible repeat\n  ${label}`);
    } else if (sameText) {
      errors.push(`Same question twice:\n  ${label}`);
    }
  }
}

// 5. Chapter totals against the target (old questions that repeat a book question do not count).
const report = [];
let short = 0;
for (const [unit, title] of [...after.units.entries()].sort((a, b) => a[0] - b[0])) {
  const rows = after.rows.filter((r) => r.unit === unit && !hidden.has(r.id));
  const c = { M: 0, S: 0, L: 0 };
  rows.forEach((r) => c[r.q[0]]++);
  const ex = added.filter((r) => r.unit === unit && r.file === EXERCISE_FILE).length;
  const xt = added.filter((r) => r.unit === unit && r.file === EXTRA_FILE).length;
  const ok = c.M >= TM && c.S >= TS && c.L >= TL;
  if (!ok) short++;
  report.push(`  u${unit} ${String(title).slice(0, 38).padEnd(38)} ${c.M}M/${c.S}S/${c.L}L  (+${ex} exercise, +${xt} extra)${ok ? "" : `  BELOW ${TM}/${TS}/${TL}`}`);
}
if (short) errors.push(`${short} chapter(s) below the target ${TM}/${TS}/${TL}`);

if (writeOverlaps) {
  const md = ["# Old questions that repeat a book exercise question", "",
    `Book: ${book.id}. Generated by content/check-book.cjs. These old rows should be set to DRAFT.`, "",
    "| Old question id | Old question | Book question (zzz-exercise.cjs) |", "|---|---|---|",
    ...overlaps.map(({ r, o }) => `| ${o.id} | ${text(o).trim().replace(/\|/g, "/")} | ${text(r).trim().replace(/\|/g, "/")} |`)];
  fs.writeFileSync(path.join(dir, "exercise-overlaps.md"), md.join("\n") + "\n", "utf8");
}

console.log(`Book ${book.id} (base ${base.slice(0, 7)})`);
console.log(`Rows: before ${before.rows.length}, after ${after.rows.length}, new ${added.length} ` +
  `(exercise ${added.filter((r) => r.file === EXERCISE_FILE).length}, extra ${added.filter((r) => r.file === EXTRA_FILE).length}), existing rows changed ${changedRows}`);
console.log(`Old questions that repeat a book question (not counted): ${overlaps.length}${writeOverlaps ? " -> exercise-overlaps.md" : ""}; already hidden by content/sql: ${hiddenBefore}`);
console.log("Chapters (counted toward target):");
console.log(report.join("\n"));
if (warns.length) console.log(`\nWARN (${warns.length}) - look at each one and fix real repeats:\n` + warns.map((w) => "- " + w).join("\n"));
if (errors.length) {
  console.log(`\nFAIL (${errors.length}):\n` + errors.map((e) => "- " + e).join("\n"));
  process.exit(1);
}
console.log("\nPASS");
