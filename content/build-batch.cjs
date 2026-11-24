// Build several books into one SQL file. Usage: node content/build-batch.cjs <out.sql> <bookDir>...
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const [out, ...dirs] = process.argv.slice(2);
let sql = "";
for (const d of dirs) {
  const tmp = `${out}.part`;
  const log = execFileSync(process.execPath, [path.join(__dirname, "build-sql.cjs"), d, tmp], { encoding: "utf8" });
  process.stdout.write(`${path.basename(d)}: ${log}`);
  sql += fs.readFileSync(tmp, "utf8");
  fs.unlinkSync(tmp);
}
fs.writeFileSync(out, sql, "utf8");
const answers = [...sql.matchAll(/::jsonb,'([0-3])'/g)].map((m) => m[1]);
const dist = [0, 1, 2, 3].map((k) => answers.filter((a) => a === String(k)).length);
console.log(`total bytes ${Buffer.byteLength(sql)}, questions ${(sql.match(/INSERT INTO "BankQuestion"/g) || []).length}, MCQ answers A-D: ${dist.join("/")}`);
