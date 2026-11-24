// Report chapters below a target number of questions per type.
// Usage: node content/gaps.cjs [mcq=10] [short=6] [long=3]
const fs = require("fs");
const path = require("path");
const [M = 10, S = 6, L = 3] = process.argv.slice(2).map(Number);
let need = { M: 0, S: 0, L: 0 };
for (const dir of fs.readdirSync(__dirname).filter((d) => d.startsWith("pecta-")).sort()) {
  const units = require("./load.cjs")(path.join(__dirname, dir));
  const rows = [];
  for (const u of units) {
    const c = { M: 0, S: 0, L: 0 };
    u.q.forEach((q) => c[q[0]]++);
    const d = { M: Math.max(0, M - c.M), S: Math.max(0, S - c.S), L: Math.max(0, L - c.L) };
    if (d.M + d.S + d.L) rows.push(`  u${u.unit} ${u.title.slice(0, 40)}: has ${c.M}/${c.S}/${c.L} need +${d.M}/+${d.S}/+${d.L}`);
    need.M += d.M; need.S += d.S; need.L += d.L;
  }
  if (rows.length) console.log(dir + "\n" + rows.join("\n"));
}
console.log(`TOTAL needed: MCQ ${need.M}, SHORT ${need.S}, LONG ${need.L}`);
