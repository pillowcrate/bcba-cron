import fs from 'fs';
// Updates the stale facts in .claude/skills/add-newsletter-day/SKILL.md.
//
// This exists because writes under .claude/ are refused by a safety classifier in
// Claude Code's environment, so the edits have to be applied by Ben running this.
// Run from the repo root:   node tools/qa/patch-skill.mjs
//
// Refuses to write unless every expected string is found, so a partial or
// double-application cannot silently corrupt the file.
const path = '.claude/skills/add-newsletter-day/SKILL.md';

const EDITS = [
  { why: 'deck size 112 -> 117',
    from: '`app/api/cron/bcba-brief/route.js`, currently 112 entries.',
    to:   '`app/api/cron/bcba-brief/route.js`, currently 117 entries.' },

  { why: 'C.3 and D.9 now have their own days; coverage is complete',
    from: '- Two TCO items are covered in substance but not separately labelled: **C.3** (measure occurrence, inside the C.4/C.9 day) and **D.9** (apply single-case designs, across the four D.7 days). Either is a reasonable target for a new day.',
    to:   '- Coverage is complete: all 104 TCO items have at least one day as of 2026-09-05. Verify with `node tools/qa/audit-task-labels.mjs`. Note day 13 is now `C.9`, not `C.4/C.9`.' },

  { why: 'merge.js cannot run — its inputs were never preserved',
    from: '`.bcba-build/` (gitignored, may not exist) holds `merge.js`, which does insertion, renumbering, validation and coverage reporting mechanically. Prefer it over hand-editing.',
    to:   'Use `tools/qa/add-days.mjs`, which appends entries, numbers them, restamps `ROTATION_ANCHOR` and validates word counts, domain/code agreement, verbatim task text, option labelling and citation reuse before writing. It dry-runs by default; pass `--write`. (The older `.bcba-build/merge.js` referenced here previously cannot run — its input files were never preserved.)' },

  { why: 'longest-answer tell is 33%, not 71%',
    from: '**Known open issue:** the correct option is the uniquely longest of the four in about 71% of questions (chance is 25%), which lets a reader score well without reading the stem. Do not make it worse — write distractors comparable in length to the key.',
    to:   '**Known open issue:** the correct option is the uniquely longest of the four in about 33% of questions (chance is 25%), down from 71% before the September 2026 fix. Do not make it worse — write distractors comparable in length to the key. Verify with `node tools/qa/measure-len.mjs`.' },
];

if (!fs.existsSync(path)) { console.error(`not found: ${path}\nRun this from the repo root.`); process.exit(1); }
let s = fs.readFileSync(path, 'utf8');

const missing = EDITS.filter(e => !s.includes(e.from));
const already = missing.filter(e => s.includes(e.to));
if (missing.length) {
  console.error(`REFUSING — ${missing.length} of ${EDITS.length} target strings not found:`);
  missing.forEach(e => console.error(`  - ${e.why}${already.includes(e) ? '  (already applied)' : '  (text differs from expected)'}`));
  if (already.length === missing.length) console.error('\nAll missing edits are already applied. Nothing to do.');
  process.exit(1);
}

for (const e of EDITS) { s = s.replace(e.from, e.to); console.log(`  ✓ ${e.why}`); }
fs.writeFileSync(path, s);
console.log(`\nwrote ${path} — ${EDITS.length} edits applied`);
