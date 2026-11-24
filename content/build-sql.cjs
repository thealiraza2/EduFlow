// Builds idempotent SQL that loads a book's units, topics and questions into the
// question bank. Usage: node content/build-sql.cjs <bookDir> <out.sql>
// <bookDir>/book.json holds the Book row; every other *.cjs file holds units.
const fs = require("fs");
const path = require("path");

const [dir, out] = process.argv.slice(2);
const book = JSON.parse(fs.readFileSync(path.join(dir, "book.json"), "utf8"));
const units = require("./load.cjs")(dir);

const s = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => (v == null ? "NULL" : `${s(JSON.stringify(v))}::jsonb`);
const slug = (code) => code.replace(/\./g, "_");
const LETTER = { A: "0", B: "1", C: "2", D: "3" };
function shuffleIdx(seedText) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  const idx = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

const lines = ["BEGIN;"];
lines.push(
  `INSERT INTO "Book" ("id","authorityId","className","subject","subjectUr","edition","sessionFrom","isCurrent","sourceUrl","updatedAt") VALUES (` +
    [s(book.id), s(book.authorityId), s(book.className), s(book.subject), s(book.subjectUr), s(book.edition), book.sessionFrom, "true", s(book.sourceUrl), "now()"].join(",") +
    `) ON CONFLICT ("id") DO NOTHING;`,
);

let count = { M: 0, S: 0, L: 0 };
const errors = [];
for (const u of units) {
  const unitId = `${book.id}_u${u.unit}`;
  lines.push(
    `INSERT INTO "BookUnit" ("id","bookId","number","title","titleUr") VALUES (${s(unitId)},${s(book.id)},${u.unit},${s(u.title)},${s(u.titleUr)}) ON CONFLICT ("id") DO NOTHING;`,
  );
  const topicCodes = new Set();
  u.topics.forEach(([code, title, titleUr], i) => {
    topicCodes.add(code);
    lines.push(
      `INSERT INTO "BookTopic" ("id","unitId","code","title","titleUr","order") VALUES (${s(`${unitId}_t${slug(code)}`)},${s(unitId)},${s(code)},${s(title)},${s(titleUr)},${i + 1}) ON CONFLICT ("id") DO NOTHING;`,
    );
  });
  const perTopic = {};
  for (const q of u.q) {
    const [kind, topic, en, ur] = q;
    if (!topicCodes.has(topic)) errors.push(`unit ${u.unit}: unknown topic ${topic}`);
    perTopic[`${kind}${topic}`] = (perTopic[`${kind}${topic}`] || 0) + 1;
    const id = `${unitId}_t${slug(topic)}_${kind.toLowerCase()}${perTopic[`${kind}${topic}`]}`;
    const last = q[q.length - 1];
    const explicitSource = last && typeof last === "object" && !Array.isArray(last) && last.source ? last.source : null;
    let type, options = null, answer = null, marks;
    if (kind === "M") {
      type = "MCQ";
      if (q[4].length !== 4 || !LETTER[q[5]]) errors.push(`${id}: bad MCQ`);
      // An option is [en, ur]; a plain string is single-language (English or Urdu books).
      const raw = q[4].map((o) => (typeof o === "string" ? (book.lang === "ur" ? { en: "", ur: o } : { en: o, ur: "" }) : { en: o[0], ur: o[1] }));
      // Deterministic shuffle seeded by the question id, so the correct option is
      // spread across A-D and re-running the build gives the same order.
      const order = shuffleIdx(id);
      options = order.map((k) => raw[k]);
      answer = String(order.indexOf(Number(LETTER[q[5]])));
      marks = 1;
    } else if (kind === "S") {
      type = "SHORT";
      marks = 2;
    } else {
      type = "LONG";
      marks = typeof q[4] === "number" ? q[4] : 5;
    }
    // Explicit source if provided (e.g. EXERCISE); reasoning ("why/explain") items are CONCEPTUAL; the rest ADDITIONAL.
    const source = explicitSource || (en && /^(why|explain|how|can )/i.test(en) ? "CONCEPTUAL" : "ADDITIONAL");
    count[kind]++;
    lines.push(
      `INSERT INTO "BankQuestion" ("id","bookId","unitId","topicId","type","source","textEn","textUr","options","answer","marks","status","updatedAt") VALUES (` +
        [s(id), s(book.id), s(unitId), s(`${unitId}_t${slug(topic)}`), `'${type}'`, `'${source}'`, s(en), s(ur), j(options), s(answer), marks, `'DRAFT'`, "now()"].join(",") +
        // Re-running updates the content but never touches review status.
        `) ON CONFLICT ("id") DO UPDATE SET "textEn"=EXCLUDED."textEn","textUr"=EXCLUDED."textUr","options"=EXCLUDED."options","answer"=EXCLUDED."answer","marks"=EXCLUDED."marks","source"=EXCLUDED."source","updatedAt"=now();`,
    );
  }
}
lines.push("COMMIT;");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`units ${units.length}, topics ${units.reduce((n, u) => n + u.topics.length, 0)}, MCQ ${count.M}, SHORT ${count.S}, LONG ${count.L}, bytes ${fs.statSync(out).size}`);
