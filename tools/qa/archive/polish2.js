// Second-pass answer-key balance: make the distribution uniform PER QUESTION
// POSITION, not just in aggregate. Each email shows q1/q2/q3 in fixed slots, so a
// per-slot skew ("q1 is usually B") is just as learnable as the global skew.
// Only the 63 original days are permuted; the 49 new ones are left alone.
// Usage: node polish2.js [--dry]
const fs = require("fs");
const path = require("path");

const BUILD = __dirname;
const ROUTE = path.join(BUILD, "..", "app", "api", "cron", "bcba-brief", "route.js");
const DRY = process.argv.includes("--dry");
const L = ["A", "B", "C", "D"];

const src = fs.readFileSync(ROUTE, "utf8");
const START = "const DAYS = [";
const bodyStart = src.indexOf(START) + START.length;
function findArrayEnd(text, from) {
  let depth = 1, i = from, inStr = false, quote = "";
  while (i < text.length) {
    const c = text[i];
    if (inStr) { if (c === "\\") { i += 2; continue; } if (c === quote) inStr = false; }
    else if (c === '"' || c === "'" || c === "`") { inStr = true; quote = c; }
    else if (c === "/" && text[i + 1] === "/") { const nl = text.indexOf("\n", i); i = nl === -1 ? text.length : nl; continue; }
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") { depth--; if (depth === 0) return i; }
    i++;
  }
  throw new Error("Unbalanced DAYS array");
}
const bodyEnd = findArrayEnd(src, bodyStart);
const DAYS = new Function(`"use strict"; return [${src.slice(bodyStart, bodyEnd)}\n];`)();

const order = JSON.parse(fs.readFileSync(path.join(BUILD, "order.json"), "utf8"));
const isNew = new Set(order.filter((o) => o.isNew).map((o) => o.day));
const oldDays = DAYS.filter((d) => !isNew.has(d.day));
if (oldDays.length !== 63) throw new Error("expected 63 old days");

// ── targets ──────────────────────────────────────────────────────────────────
const perPos = 112 / 4; // 28 of each letter in each of the three slots
const newCount = [0, 1, 2].map((p) => {
  const c = { A: 0, B: 0, C: 0, D: 0 };
  DAYS.filter((d) => isNew.has(d.day)).forEach((d) => c[d.questions[p].answer]++);
  return c;
});
const target = newCount.map((c) => {
  const t = {};
  L.forEach((l) => { t[l] = perPos - c[l]; });
  return t;
});
// Repair any negative target (a slot the new-49 already over-fills) by shifting
// the deficit onto the letters with the most headroom in that slot.
target.forEach((t, p) => {
  L.forEach((l) => {
    while (t[l] < 0) {
      const donor = L.slice().sort((a, b) => t[b] - t[a])[0];
      t[donor]--; t[l]++;
    }
  });
  const sum = L.reduce((a, l) => a + t[l], 0);
  if (sum !== 63) throw new Error(`slot ${p} targets sum to ${sum}, expected 63`);
});
console.log("Per-slot targets for the 63 old days:", JSON.stringify(target));

// ── solve: each day gets 3 distinct letters, one per slot ────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function solve(seed) {
  const rand = mulberry32(seed);
  const rem = target.map((t) => ({ ...t }));
  const out = [];
  const idx = oldDays.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  for (const di of idx) {
    // candidate triples of distinct letters, ranked by remaining headroom + jitter
    let best = null, bestScore = -Infinity;
    for (const a of L) for (const b of L) for (const c of L) {
      if (a === b || b === c || a === c) continue;
      if (rem[0][a] <= 0 || rem[1][b] <= 0 || rem[2][c] <= 0) continue;
      const score = rem[0][a] + rem[1][b] + rem[2][c] + rand() * 0.9;
      if (score > bestScore) { bestScore = score; best = [a, b, c]; }
    }
    if (!best) return null;
    rem[0][best[0]]--; rem[1][best[1]]--; rem[2][best[2]]--;
    out[di] = best;
  }
  if (rem.some((r) => L.some((l) => r[l] !== 0))) return null;
  return out;
}
let plan = null, usedSeed = 0;
for (let s = 1; s <= 20000 && !plan; s++) { plan = solve(s); usedSeed = s; }
if (!plan) throw new Error("no valid assignment found");
console.log("Solved on seed", usedSeed);

// ── apply ────────────────────────────────────────────────────────────────────
let moved = 0, letterFixes = 0;
oldDays.forEach((d, di) => {
  d.questions.forEach((q, qi) => {
    const want = plan[di][qi];
    if (q.answer === want) return;
    const texts = q.options.map((o) => o.slice(3));
    const ci = L.indexOf(q.answer);
    const correctText = texts[ci];
    const others = texts.filter((_, i) => i !== ci);
    const slot = L.indexOf(want);
    const out = [];
    let oi = 0;
    for (let i = 0; i < 4; i++) out.push(i === slot ? correctText : others[oi++]);
    q.options = out.map((t, i) => `${L[i]}. ${t}`);
    const patched = q.rationale.replace(/\b(Option|Choice|Answer)\s+([A-D])\b/g, (m0, w) => `${w} ${want}`);
    if (patched !== q.rationale) { q.rationale = patched; letterFixes++; }
    q.answer = want;
    moved++;
  });
});
console.log(`Repositioned ${moved} of 189 old questions; patched ${letterFixes} letter reference(s).`);

// ── verify ───────────────────────────────────────────────────────────────────
const glob = { A: 0, B: 0, C: 0, D: 0 };
const slots = [0, 1, 2].map(() => ({ A: 0, B: 0, C: 0, D: 0 }));
DAYS.forEach((d) => d.questions.forEach((q, p) => { glob[q.answer]++; slots[p][q.answer]++; }));
console.log("global:", JSON.stringify(glob));
slots.forEach((s, p) => {
  const chi = L.reduce((a, l) => a + Math.pow(s[l] - 28, 2) / 28, 0);
  console.log(`  q${p + 1}:`, JSON.stringify(s), "chi2=" + chi.toFixed(2), chi < 7.81 ? "(uniform)" : "(SKEWED)");
});
const allSame = DAYS.filter((d) => new Set(d.questions.map((q) => q.answer)).size === 1);
let bad = 0;
DAYS.forEach((d) => d.questions.forEach((q) => {
  if (q.options.length !== 4) bad++;
  L.forEach((l, i) => { if (!q.options[i].startsWith(l + ". ")) bad++; });
  if (!q.options.some((o) => o.startsWith(q.answer + ". "))) bad++;
}));
console.log("all-same-letter days:", allSame.length, "| structural defects:", bad);
if (bad || allSame.length) throw new Error("defects introduced");

// Conservation vs the ORIGINAL committed file, matched by question stem.
const head = require("child_process").execSync(
  "git show HEAD:app/api/cron/bcba-brief/route.js",
  { cwd: path.join(BUILD, ".."), maxBuffer: 64 * 1024 * 1024 }
).toString();
const hs = head.indexOf(START) + START.length;
const he = findArrayEnd(head, hs);
const HEAD_DAYS = new Function(`"use strict"; return [${head.slice(hs, he)}\n];`)();
const byStem = new Map();
HEAD_DAYS.forEach((d) => d.questions.forEach((q) => byStem.set(q.q, q)));
let drift = 0, matched = 0;
oldDays.forEach((d) => d.questions.forEach((q) => {
  const o = byStem.get(q.q);
  if (!o) return;
  matched++;
  const a = o.options.map((x) => x.slice(3)).sort();
  const b = q.options.map((x) => x.slice(3)).sort();
  if (JSON.stringify(a) !== JSON.stringify(b)) drift++;
  const oc = o.options[L.indexOf(o.answer)].slice(3);
  const nc = q.options[L.indexOf(q.answer)].slice(3);
  if (oc !== nc) drift++;
}));
console.log(`Conservation vs git HEAD: matched ${matched}/189 old questions, drift ${drift} (must be 0)`);
if (drift) throw new Error("option text or correct answer drifted from HEAD");

// ── re-emit ──────────────────────────────────────────────────────────────────
const s = (v) => JSON.stringify(v);
const emit = (d) => {
  const qs = d.questions.map((q) =>
    `      { q: ${s(q.q)}, options: [${q.options.map(s).join(", ")}], answer: ${s(q.answer)}, rationale: ${s(q.rationale)} }`
  ).join(",\n");
  return `  {
    day: ${d.day}, domain: ${s(d.domain)}, taskCode: ${s(d.taskCode)},
    taskDesc: ${s(d.taskDesc)},
    concept: {
      title: ${s(d.concept.title)},
      body: ${s(d.concept.body)}
    },
    research: {
      citation: ${s(d.research.citation)},
      summary: ${s(d.research.summary)}
    },
    application: ${s(d.application)},
    questions: [
${qs}
    ]
  }`;
};
const out = src.slice(0, bodyStart) + src.slice(bodyStart, src.indexOf("\n  {", bodyStart) + 1) +
  DAYS.map(emit).join(",\n") + ",\n" + src.slice(bodyEnd);
fs.writeFileSync(DRY ? path.join(BUILD, "route.p2.js") : ROUTE, out);
console.log("Wrote " + (DRY ? "route.p2.js (dry)" : ROUTE));
