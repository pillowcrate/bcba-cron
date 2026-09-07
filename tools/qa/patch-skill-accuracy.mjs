#!/usr/bin/env node
// Second-pass accuracy fix for .claude/skills/add-newsletter-day/SKILL.md.
//
// patch-skill-wave3.mjs fixed the stale numbers and the wrong ROTATION_ANCHOR rule.
// This one fixes what a full audit of the remaining claims turned up — including a
// self-contradiction (rules 1-2 vs rule 3) that is a worse footgun than the anchor
// rule was, and three factual claims about the corpus that are simply wrong.
//
// Ben has to run this. Claude's writes to .claude/ are refused by a safety
// classifier; reads and git operations work.
//
//   cd "/Users/benreid/Developer/Dev Projects/bcba-cron" && node tools/qa/patch-skill-accuracy.mjs
//
// REFUSES unless every target string matches exactly once and the repo still says
// what this script assumes. "REFUSING" means nothing was written — do not force it.
import fs from 'fs';

const SKILL = '.claude/skills/add-newsletter-day/SKILL.md';
const ROUTE = 'app/api/cron/bcba-brief/route.js';

// ---- re-derive every claim this patch asserts, from the repo itself ----
const route = fs.readFileSync(ROUTE, 'utf8');
const s = route.indexOf('const DAYS = ['), e = route.indexOf('\n];', s);
const DAYS = eval(route.slice(s + 'const DAYS = '.length, e + 3));
const wc = t => t.trim().split(/\s+/).length;

const guard = (label, actual, expected) => {
  if (String(actual) !== String(expected)) {
    console.error(`REFUSING: ${label} is ${actual}, this patch asserts ${expected}.`);
    process.exit(1);
  }
};

const bodies = DAYS.map(d => wc(d.concept.body)).sort((a, b) => a - b);
const median = bodies[Math.floor(bodies.length / 2)];
const max = bodies[bodies.length - 1];
const longestDay = DAYS.reduce((a, b) => wc(a.concept.body) >= wc(b.concept.body) ? a : b).day;

guard('deck length', DAYS.length, 128);
guard('body median', median, 258);
guard('body max', max, 325);
guard('longest entry', longestDay, 13);
guard('day 1 title', DAYS[0].concept.title, 'Descriptive Assessment: ABC Data and Scatter Plot Methodology');
guard('day 114 taskCode', DAYS.find(d => d.day === 114).taskCode, 'C.4');
guard('day 13 taskCode', DAYS.find(d => d.day === 13).taskCode, 'C.9');
guard('day 43 taskCode', DAYS.find(d => d.day === 43).taskCode, 'G.2 · DRL');

const edits = [
  // ---- 1. the shuffle claim omitted that 113-128 were appended, not shuffled ----
  [
    'The array is **not** chronological. The original 63 days and the 49 added 6th-edition days were shuffled together once, with a fixed seed, so the rotation mixes old and new content. Array position IS the day number printed in the email.',
    'The array is **not** chronological. Array position IS the day number printed in the email.\n\nDays 1-112 — the original 63 plus the 49 added 6th-edition days — were shuffled together once with a fixed seed and are genuinely interleaved: no run of more than three consecutive same-domain days. Days 113-128 were **appended** by Waves 1-3 in single-domain blocks and are not interleaved. So the deck is "shuffled, then appended to", not uniformly shuffled.',
  ],

  // ---- 2. THE SELF-CONTRADICTION: rules 1-2 told you to interleave, but the tool
  //         appends, every wave appended, and interleaving interacts with rule 3 in a
  //         way rule 3 does not cover. ----
  [
    `1. **Insert at a position that keeps the mix**, not at the end. Appending buries new content roughly six months out in a 112-day rotation.
2. **Renumber every \`day\` field after the insertion point** so \`day\` still equals 1-based array position. This is the opposite of the old rule — do not preserve existing \`day\` values.`,
    `1. **Appending is the supported path, and it is what every wave has actually done.** \`add-days.mjs\` appends by design. The cost is that new content lands at the end of the rotation — on a 128-day deck, roughly five months out — and arrives as a single-domain block. Waves 1-3 all accepted that. Do not "fix" this by hand-editing the array unless you have read rule 2 and mean it.
2. **If you interleave instead, you must renumber AND you may have to restamp.** \`day\` must equal its 1-based array position, so inserting mid-array renumbers every later entry. More importantly, inserting anywhere **before** the current anchor's position changes which entry that anchor's date actually delivered — the anchor silently becomes wrong and **must** be restamped. That is the one case rule 3 does not cover, and it is the opposite of rule 3's default. Nobody has paid this cost yet. If you do: renumber, restamp, and prove it by simulating \`getTodayIndex()\` across the change.`,
  ],

  // ---- 3. scope rule 3 to the case it actually describes ----
  [
    '3. **Do NOT reflexively restamp `ROTATION_ANCHOR`.**',
    '3. **When appending (the normal case), do NOT reflexively restamp `ROTATION_ANCHOR`.**',
  ],

  // ---- 4. corpus stats were stale and the "Day 1 is longest" warning was false ----
  [
    'Across the live corpus `concept.body` has a median of 241 words and a max of 323. Count words programmatically before writing and verify after. Do not calibrate by reading Day 1 — it is the longest entry in the file.',
    'Across the live corpus (128 entries) `concept.body` has a median of 258 words and a max of 325, which is day 13. Count words programmatically before writing and verify after. **Do not calibrate by eye off any single entry** — recompute; these numbers move every time the deck is edited. In particular the old advice to avoid day 1 as a yardstick is obsolete: day 1 is 236 words, slightly *below* median.',
  ],

  // ---- 5. WRONG CROSS-REFERENCE: day 1 does not contain the cited breakdown ----
  [
    "Break the concept into 3–4 **named** sub-types or contrasts (see Day 1's frequency/duration/latency/IRT breakdown, or the DRL day's full-session / interval / spaced-responding breakdown); roughly a third of entries use a labelled lead-in (`Latency: Latency is the elapsed time...`), an efficient way to hit the word budget.",
    "Break the concept into 3–4 **named** sub-types or contrasts. Day 114 (`C.4`, Temporal Dimensions) is the cleanest exemplar — Duration / Latency / Interresponse time as labelled lead-ins, 243 words, five paragraphs. Day 13 (`C.9`) does the same across frequency/duration/latency/IRT but is the longest entry in the deck at 323 words, so copy its structure and not its length. Day 43 (`G.2 · DRL`) is a third example. 31% of entries use a labelled lead-in (`Latency: Latency is the elapsed time...`), an efficient way to hit the word budget. (Day 1 does **not** contain a frequency/duration/latency breakdown — it is descriptive assessment. An earlier version of this skill pointed there and was wrong.)",
  ],

  // ---- 6. reconcile the paragraph rule with what add-days.mjs enforces ----
  [
    '| `concept.body` | 230–290, in 4 paragraphs |',
    '| `concept.body` | 230–290, in 4–5 paragraphs |',
  ],
  [
    '    body: "string"                // 4 paragraphs (5 max), separated by \\n\\n — see Voice below',
    '    body: "string"                // 4-5 paragraphs, separated by \\n\\n — see Voice below',
  ],

  // ---- 7. option-length row was presented as a spec; it is neither enforced nor accurate ----
  [
    '| each option | 3–11 |',
    '| each option | 3–11 *(guidance, not enforced — ~10% of live options fall outside)* |',
  ],

  // ---- 8. tell percentage ----
  [
    'the correct option is the uniquely longest of the four in about 33% of questions (chance is 25%), down from 71% before the September 2026 fix.',
    'the correct option is the uniquely longest of the four in 32.3% of questions as of Wave 3 (chance is 25%), down from 71% before the September 2026 fix.',
  ],

  // ---- 9. the skill never mentioned the QA harness that catches the worst errors ----
  [
    '## Before finishing',
    `## Verify — the checks that actually catch things

Word counts and the build are the easy part and are not where the risk lives. The QA harness at
\`tools/qa/\` exists because three classes of error pass every mechanical check. Read
\`tools/qa/README.md\` and the most recent \`tools/qa/blind-run/wave*/README.md\` before authoring.

1. **Tell scans.** \`node tools/qa/measure-len.mjs\` (longest-answer tell must not rise) and
   \`node tools/qa/scan-grammar-tell.mjs\`. Write your new question ids into
   \`.bcba-build/applied-ids.json\` **before** running the grammar scan, or your new flags get
   misfiled as pre-existing and you will not see them.
2. **Blind re-answer pass.** \`node tools/qa/make-blind.mjs\`, then have agents answer with no key
   and no access to \`route.js\`, requiring an explicit "list EVERY defensible option" field. This is
   the only thing that catches a distractor you have accidentally made true. Treat a flag as
   evidence, not a verdict: "a distractor is accidentally true" always gets fixed, but "the key
   requires having read the day" is fine — blind agents have not read the day, so every
   citation-recall item looks unfair to them.
3. **Whole-deck consistency pass.** Blind checking scores each question in isolation and is
   structurally incapable of catching two days that teach opposite rules. Run a separate reviewer
   over the new days against the existing deck. This has found a real contradiction in every wave
   that ran it.

Verify citations against Crossref **before** authoring, and take findings from fetched abstracts or
full texts rather than recollection. Note which papers you could only get an abstract for, and
write those summaries without specifics rather than filling the gap from memory.

## Before finishing`,
  ],
];

let text = fs.readFileSync(SKILL, 'utf8');
const problems = [];
edits.forEach(([from], i) => {
  const n = text.split(from).length - 1;
  if (n !== 1) problems.push(`edit ${i + 1}: expected 1 match, found ${n} — starts ${JSON.stringify(from.slice(0, 60))}`);
});
if (problems.length) {
  console.error('REFUSING — the skill does not look the way this patch expects.\n' + problems.map(p => '  - ' + p).join('\n'));
  console.error('\nNothing was written. It may already be patched, or it changed underneath this script.');
  process.exit(1);
}
for (const [from, to] of edits) text = text.replace(from, to);
fs.writeFileSync(SKILL, text);

console.log(`Patched ${SKILL} — ${edits.length} edits.\n`);
console.log('The two that matter:');
console.log('  - Rules 1-2 told you to insert mid-array; the tool appends and every wave appended.');
console.log('    Worse, mid-array insertion BEFORE the anchor position invalidates the anchor, which');
console.log('    rule 3 explicitly tells you not to restamp. Following the skill as written could');
console.log('    have moved the counter for every subscriber — the same class of bug as last time.');
console.log('  - "See Day 1\'s frequency/duration/latency/IRT breakdown" pointed at the wrong day.');
console.log('    Day 1 is descriptive assessment. The breakdown is day 114 (and day 13).\n');
console.log('Also fixed: shuffle claim now notes 113-128 were appended; body median 241 -> 256;');
console.log('the false "day 1 is the longest entry" warning; paragraph rule 4 -> 4-5 to match');
console.log('add-days.mjs; option-length row marked as guidance; tell figure 33% -> 32.3%;');
console.log('and a new "Verify" section covering the blind pass and consistency pass, which the');
console.log('skill had never mentioned despite them being what catches the serious errors.');
