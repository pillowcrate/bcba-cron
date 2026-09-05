// Merge the newly authored BCBA day entries into route.js:
//   - remap all 63 legacy taskCodes to 6th-edition TCO codes
//   - validate every entry (schema + length bands measured from the live 63)
//   - report TCO coverage
//   - interleave old and new deterministically (fixed seed, baked into the file)
//   - renumber `day` to match delivery position and re-emit in the file's style
// Usage:  node merge.js [--dry]
const fs = require("fs");
const path = require("path");

const BUILD = __dirname;
const ROUTE = path.join(BUILD, "..", "app", "api", "cron", "bcba-brief", "route.js");
const DRY = process.argv.includes("--dry");
const W = (s) => s.split(/\s+/).filter(Boolean).length;

// ── 1. Pull the DAYS array literal out of route.js ───────────────────────────
const src = fs.readFileSync(ROUTE, "utf8");
const START = "const DAYS = [";
const startIdx = src.indexOf(START);
if (startIdx === -1) throw new Error("Could not find `const DAYS = [` in route.js");
const bodyStart = startIdx + START.length;

function findArrayEnd(text, from) {
  let depth = 1, i = from, inStr = false, quote = "";
  while (i < text.length) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") { i += 2; continue; }
      if (c === quote) inStr = false;
    } else if (c === '"' || c === "'" || c === "`") { inStr = true; quote = c; }
    else if (c === "/" && text[i + 1] === "/") {
      const nl = text.indexOf("\n", i);
      i = nl === -1 ? text.length : nl;
      continue;
    } else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") { depth--; if (depth === 0) return i; }
    i++;
  }
  throw new Error("Unbalanced DAYS array");
}
const bodyEnd = findArrayEnd(src, bodyStart);

function evalEntries(text, label) {
  try {
    return new Function(`"use strict"; return [${text}\n];`)();
  } catch (e) {
    throw new Error(`Failed to parse ${label}: ${e.message}`);
  }
}

const oldDays = evalEntries(src.slice(bodyStart, bodyEnd), "route.js DAYS array");
console.log(`Parsed ${oldDays.length} existing entries.`);

// ── 2. Load the newly authored group files ───────────────────────────────────
const partFiles = fs.readdirSync(BUILD).filter((f) => /^out_g\d+\.js$/.test(f)).sort();
if (!partFiles.length) throw new Error("No out_gNN.js files found in " + BUILD);

let newDays = [];
for (const f of partFiles) {
  let text = fs.readFileSync(path.join(BUILD, f), "utf8").trim();
  text = text.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "").trim().replace(/,\s*$/, "");
  const entries = evalEntries(text, f);
  console.log(`  ${f}: ${entries.length} — ${entries.map((d) => d.taskCode).join(", ")}`);
  newDays = newDays.concat(entries);
}
console.log(`Parsed ${newDays.length} new entries.`);

// ── 3. Remap every legacy taskCode to the 6th-edition TCO ────────────────────
const remap = JSON.parse(fs.readFileSync(path.join(BUILD, "remap.json"), "utf8"));
oldDays.forEach((d) => {
  const to = remap[String(d.day)];
  if (!to) throw new Error(`No 6th-ed remap for existing day ${d.day} (${d.taskCode})`);
  d.taskCode = to;
});
console.log("Remapped all 63 legacy taskCodes to 6th-edition TCO.");

// ── 4. Validate ──────────────────────────────────────────────────────────────
const DOMAINS = new Set([
  "Philosophical Underpinnings", "Concepts and Principles", "Measurement",
  "Experimental Design", "Ethics", "Behavior Assessment",
  "Behavior-Change Procedures", "Selecting and Implementing Interventions",
  "Personnel Supervision", "Verbal Behavior", "Generalization and Maintenance",
]);
// Bands measured from the 63 live entries; applied strictly to new entries only.
const BAND = { body: [200, 330], summary: [100, 145], application: [45, 95], rationale: [18, 48] };
const problems = [];
const warnings = [];

function validate(d, where, strict) {
  const id = `${where} (${d && d.taskCode})`;
  if (!d || typeof d !== "object") return problems.push(`${id}: not an object`);
  for (const k of ["domain", "taskCode", "taskDesc", "application"])
    if (typeof d[k] !== "string" || !d[k].trim()) problems.push(`${id}: missing/empty ${k}`);
  if (!DOMAINS.has(d.domain)) problems.push(`${id}: unknown domain "${d.domain}"`);

  const band = (val, key, label) => {
    const [lo, hi] = BAND[key];
    if (val < lo || val > hi) warnings.push(`${id}: ${label} ${val} words (target ${lo}-${hi})`);
  };

  if (!d.concept || typeof d.concept.title !== "string" || typeof d.concept.body !== "string")
    problems.push(`${id}: bad concept`);
  else {
    const paras = d.concept.body.split("\n\n").filter(Boolean);
    if (paras.length < 3) problems.push(`${id}: body has ${paras.length} paragraphs (need >=3)`);
    if (d.concept.body.replace(/\n\n/g, "").includes("\n"))
      problems.push(`${id}: stray single newline in body`);
    if (strict) band(W(d.concept.body), "body", "body");
  }
  if (strict && typeof d.application === "string") band(W(d.application), "application", "application");
  if (!d.research || typeof d.research.citation !== "string" || typeof d.research.summary !== "string")
    problems.push(`${id}: bad research`);
  else {
    if (W(d.research.summary) < 80) problems.push(`${id}: research.summary too short`);
    if (strict) band(W(d.research.summary), "summary", "summary");
  }
  if (!Array.isArray(d.questions) || d.questions.length !== 3)
    problems.push(`${id}: expected 3 questions, got ${d.questions && d.questions.length}`);
  else {
    d.questions.forEach((q, i) => {
      const qid = `${id} q${i + 1}`;
      if (typeof q.q !== "string" || !q.q.trim()) problems.push(`${qid}: missing q`);
      if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`${qid}: needs 4 options`);
      else ["A. ", "B. ", "C. ", "D. "].forEach((p, j) => {
        if (typeof q.options[j] !== "string" || !q.options[j].startsWith(p))
          problems.push(`${qid}: option ${j + 1} must start with "${p}"`);
      });
      if (!["A", "B", "C", "D"].includes(q.answer)) problems.push(`${qid}: bad answer "${q.answer}"`);
      if (typeof q.rationale !== "string" || W(q.rationale) < 12)
        problems.push(`${qid}: rationale missing/too short`);
      else if (strict) band(W(q.rationale), "rationale", "rationale");
    });
    if (new Set(d.questions.map((q) => q.answer)).size === 1)
      warnings.push(`${id}: all three answers are "${d.questions[0].answer}"`);
  }
}
oldDays.forEach((d, i) => validate(d, `old#${i + 1}`, false));
newDays.forEach((d, i) => validate(d, `new#${i + 1}`, true));

const codeSeen = new Map();
[...oldDays, ...newDays].forEach((d) => d && d.taskCode &&
  codeSeen.set(d.taskCode, (codeSeen.get(d.taskCode) || 0) + 1));
for (const [code, n] of codeSeen) if (n > 1) problems.push(`duplicate taskCode "${code}" x${n}`);

if (problems.length) {
  console.error("\nVALIDATION FAILED:");
  problems.forEach((p) => console.error("  - " + p));
  process.exit(1);
}
if (warnings.length) {
  console.log(`\nLength warnings (${warnings.length}):`);
  warnings.forEach((w) => console.log("  ! " + w));
  console.log("");
}
console.log("Validation passed.");

// ── 5. Coverage against all 104 6th-edition TCO items ────────────────────────
const TCO = { A: 5, B: 24, C: 12, D: 9, E: 12, F: 8, G: 19, H: 8, I: 7 };
const covered = new Set();
[...oldDays, ...newDays].forEach((d) =>
  d.taskCode.split("·")[0].trim().split("/").forEach((c) => {
    const m = c.trim().match(/^([A-I])\.(\d+)$/);
    if (m) covered.add(`${m[1]}.${m[2]}`);
  }));
const missing = [];
let tcoTotal = 0;
for (const [L, n] of Object.entries(TCO)) {
  tcoTotal += n;
  for (let i = 1; i <= n; i++) if (!covered.has(`${L}.${i}`)) missing.push(`${L}.${i}`);
}
console.log(`TCO coverage: ${tcoTotal - missing.length}/${tcoTotal} items explicitly labelled.`);
if (missing.length) console.log(`  Not explicitly labelled: ${missing.join(", ")}`);

// ── 6. Interleave old and new (fixed seed — order is baked in, not runtime) ──
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260903);
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const oldQ = shuffle(oldDays);
const newQ = shuffle(newDays);
const total = oldQ.length + newQ.length;

// Bresenham-style even spread so there is never a long run of only-old or only-new.
const slots = [];
let acc = 0;
for (let i = 0; i < total; i++) {
  acc += newQ.length;
  if (acc >= total) { slots.push("new"); acc -= total; } else slots.push("old");
}
let diff = slots.filter((s) => s === "new").length - newQ.length;
for (let i = slots.length - 1; i >= 0 && diff !== 0; i--) {
  if (diff > 0 && slots[i] === "new") { slots[i] = "old"; diff--; }
  else if (diff < 0 && slots[i] === "old") { slots[i] = "new"; diff++; }
}

let oi = 0, ni = 0;
const merged = slots.map((s) => (s === "new" ? newQ[ni++] : oldQ[oi++]));
if (oi !== oldQ.length || ni !== newQ.length) throw new Error("Interleave lost entries");

// Light repair: avoid two consecutive days from the same domain, preserving slot pattern.
for (let pass = 0; pass < 3; pass++)
  for (let i = 1; i < merged.length; i++) {
    if (merged[i].domain !== merged[i - 1].domain) continue;
    for (let j = i + 2; j < Math.min(i + 14, merged.length); j++) {
      if (slots[j] !== slots[i]) continue;
      const okA = merged[j].domain !== merged[i - 1].domain &&
        (i + 1 >= merged.length || merged[j].domain !== merged[i + 1].domain);
      const okB = merged[i].domain !== merged[j - 1].domain &&
        (j + 1 >= merged.length || merged[i].domain !== merged[j + 1].domain);
      if (okA && okB) { [merged[i], merged[j]] = [merged[j], merged[i]]; break; }
    }
  }

const adj = merged.filter((d, i) => i > 0 && d.domain === merged[i - 1].domain).length;
let longest = 0, run = 0, rt = null;
slots.forEach((s) => { run = s === rt ? run + 1 : 1; rt = s; if (run > longest) longest = run; });
console.log(`Merged ${merged.length}. Same-domain adjacencies: ${adj}. Longest old/new run: ${longest}.`);

merged.forEach((d, i) => { d.day = i + 1; });

// ── 7. Re-emit in the file's existing formatting style ───────────────────────
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
  // Task codes follow the BACB BCBA Test Content Outline (6th ed.).
  // Order is intentional and fixed: the original ${oldDays.length} days and the ${newDays.length} added
  // 6th-edition days were shuffled together once so the rotation mixes old and new.
  // Delivery index = elapsed weekdays % DAYS.length, so array position IS the day
  // number shown in the email. Do not reorder without renumbering \`day\`.
`;
const out = src.slice(0, bodyStart) + header + merged.map(emit).join(",\n") + ",\n" + src.slice(bodyEnd);

if (DRY) {
  fs.writeFileSync(path.join(BUILD, "route.preview.js"), out);
  console.log("DRY RUN -> route.preview.js written; route.js untouched.");
} else {
  fs.writeFileSync(ROUTE, out);
  console.log("Wrote " + ROUTE);
}
fs.writeFileSync(path.join(BUILD, "order.json"), JSON.stringify(
  merged.map((d, i) => ({ day: i + 1, isNew: slots[i] === "new", domain: d.domain, taskCode: d.taskCode, title: d.concept.title })), null, 2));
console.log("Wrote order.json");
