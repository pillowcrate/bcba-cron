import fs from 'fs';
// Audit every day's taskCode/taskDesc against the verbatim 6th-edition outline.
// Reference: tools/qa/tco-6th-ed.json, extracted with pypdf from the BACB PDF
// (sha256 90158ce7a06d8ccc2e432e823c196d3255940921a73d26d7f8c55e921d5af3ad).
const src = fs.readFileSync('app/api/cron/bcba-brief/route.js', 'utf8');
const s = src.indexOf('const DAYS = ['), e = src.indexOf('\n];', s);
const arr = eval(src.slice(s + 'const DAYS = '.length, e + 3));
const TCO = JSON.parse(fs.readFileSync('tools/qa/tco-6th-ed.json', 'utf8'));

const norm = x => (x || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// crude bag-of-words overlap; enough to separate "verbatim" from "different item entirely"
const overlap = (a, b) => {
  const A = new Set(norm(a).split(' ').filter(w => w.length > 3));
  const B = new Set(norm(b).split(' ').filter(w => w.length > 3));
  if (!A.size || !B.size) return 0;
  let hit = 0; for (const w of A) if (B.has(w)) hit++;
  return hit / Math.max(A.size, B.size);
};

const seen = new Set(), rows = [];
for (const d of arr) {
  const codes = d.taskCode.split('/').map(p => (p.trim().match(/^([A-I])\.(\d+)/) || [])[0]).filter(Boolean);
  codes.forEach(c => seen.add(c));
  const best = codes.map(c => ({ c, sim: overlap(d.taskDesc, TCO[c]) })).sort((x, y) => y.sim - x.sim)[0];
  if (!best) { rows.push({ day: d.day, code: d.taskCode, kind: 'UNPARSEABLE CODE', detail: '' }); continue; }
  // a composite code ("B.12/B.13") carries both items' text, joined
  const exact = norm(d.taskDesc) === norm(codes.map(c => TCO[c]).join(' '));
  if (exact) continue;
  rows.push({
    day: d.day, code: d.taskCode, kind: best.sim >= 0.6 ? 'near-miss wording' : 'WRONG ITEM',
    detail: `sim=${best.sim.toFixed(2)} best=${best.c}\n      is:     "${d.taskDesc}"\n      should: "${TCO[best.c]}"`,
  });
}

console.log(`days: ${arr.length}   distinct task codes referenced: ${seen.size} / 104`);
const missing = Object.keys(TCO).filter(c => !seen.has(c));
console.log(`codes with no day: ${missing.join(', ') || 'none'}\n`);

const wrong = rows.filter(r => r.kind === 'WRONG ITEM');
const near = rows.filter(r => r.kind === 'near-miss wording');
console.log(`=== taskDesc does not match the item it claims (${wrong.length}) ===`);
wrong.forEach(r => console.log(`  day ${r.day} [${r.code}] ${r.detail}`));
console.log(`\n=== taskDesc close but not verbatim (${near.length}) ===`);
near.forEach(r => console.log(`  day ${r.day} [${r.code}] ${r.detail}`));

// a code is "shared" if its only day also claims another code
const dayCount = {};
for (const d of arr) for (const c of d.taskCode.split('/').map(p => (p.trim().match(/^([A-I])\.(\d+)/) || [])[0]).filter(Boolean))
  (dayCount[c] = dayCount[c] || []).push(d.day);
const shared = Object.entries(dayCount).filter(([c, ds]) =>
  ds.length === 1 && arr.find(d => d.day === ds[0]).taskCode.includes('/'));
console.log(`\n=== items with no day of their own (${shared.length}) ===`);
shared.forEach(([c, ds]) => console.log(`  ${c} — only on day ${ds[0]}`));
