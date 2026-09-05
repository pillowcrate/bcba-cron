// Post-merge polish:
//   1. Rename `domain` values to the official BCBA 6th-edition TCO domain names.
//   2. Rebalance answer keys across the 63 ORIGINAL days (they were 51% "B").
//   3. Rewrite any rationale that names an option by letter so it still matches.
// Usage: node polish.js [--dry]
const fs = require("fs");
const path = require("path");

const BUILD = __dirname;
const ROUTE = path.join(BUILD, "..", "app", "api", "cron", "bcba-brief", "route.js");
const DRY = process.argv.includes("--dry");

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
if (DAYS.length !== 112) throw new Error("expected 112 entries, got " + DAYS.length);

// ── 1. Official 6th-edition TCO domain names ─────────────────────────────────
const RENAME = {
  "Philosophical Underpinnings": "Behaviorism and Philosophical Foundations",
  "Measurement": "Measurement, Data Display, and Interpretation",
  "Ethics": "Ethical and Professional Issues",
  "Personnel Supervision": "Personnel Supervision and Management",
  // unchanged, listed so the official set is explicit:
  "Concepts and Principles": "Concepts and Principles",
  "Experimental Design": "Experimental Design",
  "Behavior Assessment": "Behavior Assessment",
  "Behavior-Change Procedures": "Behavior-Change Procedures",
  "Selecting and Implementing Interventions": "Selecting and Implementing Interventions",
};
const renamed = {};
DAYS.forEach((d) => {
  const to = RENAME[d.domain];
  if (!to) throw new Error(`Unmapped domain "${d.domain}" on day ${d.day}`);
  if (to !== d.domain) renamed[d.domain] = (renamed[d.domain] || 0) + 1;
  d.domain = to;
});
console.log("Domain renames:", JSON.stringify(renamed));

// Re-assert domain letter matches task code letter after renaming.
const LETTER = {
  "Behaviorism and Philosophical Foundations": "A", "Concepts and Principles": "B",
  "Measurement, Data Display, and Interpretation": "C", "Experimental Design": "D",
  "Ethical and Professional Issues": "E", "Behavior Assessment": "F",
  "Behavior-Change Procedures": "G", "Selecting and Implementing Interventions": "H",
  "Personnel Supervision and Management": "I",
};
DAYS.forEach((d) => {
  const letters = new Set(d.taskCode.split("·")[0].trim().split("/").map((s) => s.trim()[0]));
  if (!letters.has(LETTER[d.domain]))
    throw new Error(`day ${d.day}: domain "${d.domain}" vs code "${d.taskCode}"`);
});
console.log("Domain/code consistency re-verified for all 112.");

// ── 2. Rebalance answer keys on the ORIGINAL 63 days ─────────────────────────
const order = JSON.parse(fs.readFileSync(path.join(BUILD, "order.json"), "utf8"));
const isNew = new Set(order.filter((o) => o.isNew).map((o) => o.day));
const oldDays = DAYS.filter((d) => !isNew.has(d.day));
const newDays = DAYS.filter((d) => isNew.has(d.day));
if (oldDays.length !== 63 || newDays.length !== 49) throw new Error("old/new split wrong");

const L = ["A", "B", "C", "D"];
const count = (arr) => arr.reduce((m, d) => { d.questions.forEach((q) => m[q.answer]++); return m; }, { A: 0, B: 0, C: 0, D: 0 });
const before = count(DAYS);
const newCount = count(newDays);

// Choose per-day OMITTED letter so each old day gets 3 distinct letters (which
// guarantees no day is all-one-letter), and totals land near-uniform overall.
const totalQ = 336, ideal = totalQ / 4;
const need = {};
L.forEach((l) => { need[l] = Math.max(0, Math.round(ideal - newCount[l])); });
// each old day uses 3 of 4 letters => usage(l) = 63 - omit(l); sum(omit) = 63
const omit = {};
L.forEach((l) => { omit[l] = 63 - need[l]; });
let drift = Object.values(omit).reduce((a, b) => a + b, 0) - 63;
for (const l of ["C", "D", "A", "B"]) { while (drift !== 0 && omit[l] > 0 && drift > 0) { omit[l]--; drift--; } }
for (const l of ["B", "A", "D", "C"]) { while (drift < 0) { omit[l]++; drift++; } }
if (Object.values(omit).some((v) => v < 0)) throw new Error("negative omission count");
console.log("Planned omissions per letter across 63 old days:", JSON.stringify(omit));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(90312026);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const omitPool = shuffle(L.flatMap((l) => Array(omit[l]).fill(l)));
if (omitPool.length !== 63) throw new Error("omission pool is " + omitPool.length + ", expected 63");

let letterFixes = 0, reordered = 0;
oldDays.forEach((d, di) => {
  const skip = omitPool[di];
  const targets = shuffle(L.filter((l) => l !== skip)); // 3 distinct letters
  d.questions.forEach((q, qi) => {
    const want = targets[qi];
    if (q.answer === want) return;
    const texts = q.options.map((o) => o.slice(3));      // strip "A. "
    const correctText = texts[L.indexOf(q.answer)];
    const others = texts.filter((_, i) => i !== L.indexOf(q.answer));
    const slot = L.indexOf(want);
    const out = [];
    let oi = 0;
    for (let i = 0; i < 4; i++) out.push(i === slot ? correctText : others[oi++]);
    q.options = out.map((t, i) => `${L[i]}. ${t}`);
    // keep any explicit letter reference in the rationale correct
    const patched = q.rationale.replace(/\b(Option|Choice|Answer)\s+([A-D])\b/g, (m0, w) => `${w} ${want}`);
    if (patched !== q.rationale) { q.rationale = patched; letterFixes++; }
    q.answer = want;
    reordered++;
  });
});
console.log(`Reordered ${reordered} of 189 old questions; patched ${letterFixes} letter reference(s).`);

// ── verify ───────────────────────────────────────────────────────────────────
const after = count(DAYS);
console.log("Answer distribution  before:", JSON.stringify(before), "\n                      after:", JSON.stringify(after));
const allSame = DAYS.filter((d) => new Set(d.questions.map((q) => q.answer)).size === 1);
console.log("Days with all three answers identical:", allSame.length);
let bad = 0;
DAYS.forEach((d) => d.questions.forEach((q) => {
  if (q.options.length !== 4) bad++;
  L.forEach((l, i) => { if (!q.options[i].startsWith(l + ". ")) bad++; });
  if (!q.options.some((o) => o.startsWith(q.answer + ". "))) bad++;
}));
console.log("Structural defects after rebalance:", bad);
if (bad || allSame.length) throw new Error("rebalance produced defects");

// Option text must be conserved exactly (as a multiset) per question.
const orig = new Function(`"use strict"; return [${src.slice(bodyStart, bodyEnd)}\n];`)();
let textDrift = 0;
orig.forEach((od, i) => od.questions.forEach((oq, j) => {
  const a = oq.options.map((o) => o.slice(3)).sort();
  const b = DAYS[i].questions[j].options.map((o) => o.slice(3)).sort();
  if (JSON.stringify(a) !== JSON.stringify(b)) textDrift++;
  const oldCorrect = oq.options[L.indexOf(oq.answer)].slice(3);
  const newCorrect = DAYS[i].questions[j].options[L.indexOf(DAYS[i].questions[j].answer)].slice(3);
  if (oldCorrect !== newCorrect) textDrift++;
}));
console.log("Questions whose option text or correct-answer TEXT changed:", textDrift, "(must be 0)");
if (textDrift) throw new Error("option text drifted");

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
const header = `
  // Domains and task codes follow the BACB BCBA Test Content Outline (6th ed.).
  // Order is intentional and fixed: the original 63 days and the 49 added
  // 6th-edition days were shuffled together once so the rotation mixes old and new.
  // Array position IS the day number shown in the email (see ROTATION_ANCHOR).
  // Do not reorder without renumbering \`day\`.
`;
const out = src.slice(0, bodyStart) + header + DAYS.map(emit).join(",\n") + ",\n" + src.slice(bodyEnd);
const dest = DRY ? path.join(BUILD, "route.polished.js") : ROUTE;
fs.writeFileSync(dest, out);
console.log("Wrote " + dest);
