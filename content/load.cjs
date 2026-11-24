// Load a book folder's units. Files load in name order and units with the same
// number are merged, so a later file (e.g. zz-more.cjs: [{ unit, q: [...] }])
// appends questions without changing the ids of earlier ones.
const fs = require("fs");
const path = require("path");

module.exports = function loadUnits(dir) {
  const merged = new Map();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".cjs")).sort();
  for (const f of files) {
    for (const u of require(path.resolve(dir, f))) {
      const m = merged.get(u.unit);
      if (!m) {
        merged.set(u.unit, { ...u, topics: [...(u.topics || [])], q: [...u.q] });
        continue;
      }
      m.q.push(...u.q);
      for (const t of u.topics || []) if (!m.topics.some((x) => x[0] === t[0])) m.topics.push(t);
    }
  }
  return [...merged.values()].sort((a, b) => a.unit - b.unit);
};
