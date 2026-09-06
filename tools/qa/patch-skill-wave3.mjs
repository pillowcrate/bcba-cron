#!/usr/bin/env node
// Update .claude/skills/add-newsletter-day/SKILL.md for Wave 3 (deck now 128 days).
//
// Ben has to run this. Claude's writes to .claude/ are refused by a safety
// classifier (reads are fine), so the correction is staged here and installed by
// one command. See the memory note bcba-cron-deploy-blocked-for-claude.
//
//   cd "/Users/benreid/Developer/Dev Projects/bcba-cron" && node tools/qa/patch-skill-wave3.mjs
//
// It REFUSES unless every target string matches exactly and the repo still says
// what this script assumes, so a second run changes nothing. "REFUSING" means
// nothing was written — do not force it.
import fs from 'fs';

const SKILL = '.claude/skills/add-newsletter-day/SKILL.md';
const ROUTE = 'app/api/cron/bcba-brief/route.js';

// ---- re-derive ground truth from the repo so this cannot write a false claim ----
const route = fs.readFileSync(ROUTE, 'utf8');
const s = route.indexOf('const DAYS = ['), e = route.indexOf('\n];', s);
const DAYS = eval(route.slice(s + 'const DAYS = '.length, e + 3));
const EXPECTED = 128;
if (DAYS.length !== EXPECTED) {
  console.error(`REFUSING: route.js has ${DAYS.length} days, this patch describes ${EXPECTED}.`);
  process.exit(1);
}
const letters = { A: 0, B: 0, C: 0, D: 0 };
for (const d of DAYS) for (const q of d.questions) letters[q.answer]++;
const bal = `${letters.A}/${letters.B}/${letters.C}/${letters.D}`;
if (bal !== '96/96/96/96') {
  console.error(`REFUSING: answer balance is ${bal}, this patch describes 96/96/96/96.`);
  process.exit(1);
}
const anchor = (route.match(/const ROTATION_ANCHOR = \{[^}]*\};/) || [''])[0];
if (!anchor.includes('"2026-09-04"') || !anchor.includes('dayNumber: 16')) {
  console.error(`REFUSING: ROTATION_ANCHOR is not the expected 2026-09-04 / 16. Found: ${anchor}`);
  process.exit(1);
}

const edits = [
  // 1. deck size
  [
    'currently 122 entries',
    'currently 128 entries',
  ],
  // 2. THE DANGEROUS ONE — numbered item 3 stated the wrong anchor rule outright.
  [
    '3. **Restamp `ROTATION_ANCHOR`** in the same file. The delivery index is `(ROTATION_ANCHOR.dayNumber - 1 + countWeekdays(ROTATION_ANCHOR.date, today)) % DAYS.length`. Changing `DAYS.length` without restamping makes the printed counter jump. Set `date` to the most recent send date and `dayNumber` to the number that send actually showed — read it from the subject line of the last email rather than calculating it.',
    '3. **Do NOT reflexively restamp `ROTATION_ANCHOR`.** The delivery index is `(ROTATION_ANCHOR.dayNumber - 1 + countWeekdays(ROTATION_ANCHOR.date, today)) % DAYS.length`. The invariant is **not** "length changed" — it is that the anchor names a real past send whose number was not produced by a wrap under the old modulus. If it still does, growing the deck diverges from the old rotation only at the old wrap point, which is exactly where new days should appear. **Restamping an already-correct anchor moves the counter and is itself the bug.** Restamp only when the anchor is stale or sits after a wrap; then set `date` to a real past send and `dayNumber` to the number that send actually showed, read from the subject line rather than calculated. Verify either way by simulating `getTodayIndex()` over ~400 days under both the old and new lengths.',
  ],
  // 3. adjacency violation — now three waves deep
  [
    `   **Known violation, accepted.** Wave 2 (Sept 2026) appended days 118-122, all
   domain I, immediately after day 117 (also domain I). Subscribers therefore get
   six consecutive Personnel Supervision sends, 2027-01-23 to 2027-02-01. Appending
   is what \`add-days.mjs\` does by design; interleaving instead would renumber every
   later entry and require an anchor restamp. Fix this by interleaving if a later
   wave is willing to pay that cost.`,
    `   **Known violation, accepted — and now compounding.** Wave 2 (Sept 2026)
   appended days 118-122, all domain I, immediately after day 117 (also domain I):
   six consecutive Personnel Supervision sends, 2027-01-23 to 2027-02-01. Wave 3
   then appended days 123-128, all domain F, giving six consecutive Behavior
   Assessment sends, 2027-02-02 to 2027-02-09. So the rotation now ends in twelve
   straight single-domain days. Appending is what \`add-days.mjs\` does by design;
   interleaving would renumber every later entry and force an anchor restamp. Ben
   was told and accepted it both times. If a wave ever is willing to pay the
   renumbering cost, this is the thing to fix.`,
  ],
  // 4. anchor status note
  [
    `   **ROTATION_ANCHOR after Wave 2:** left at \`{date: "2026-09-04", dayNumber: 16}\`
   and deliberately NOT restamped. The invariant is not "length changed" but "the
   anchor names a real past send whose number was not produced by a wrap". It still
   does, so growing 117 -> 122 only changes behaviour at the old wrap point, which is
   exactly where the new days should appear. Restamping an already-correct anchor
   moves the counter and is itself the bug. See the comment above ROTATION_ANCHOR
   in route.js.`,
    `   **ROTATION_ANCHOR after Wave 3:** still \`{date: "2026-09-04", dayNumber: 16}\`,
   deliberately NOT restamped in either Wave 2 or Wave 3. It names a real past send
   whose number was not produced by a wrap, so it remains correct. Verified for
   122 -> 128 by simulating \`getTodayIndex()\` over 420 days under both lengths:
   Mon 2026-09-07 renders Day 17 either way, the printed counter never jumps or
   repeats, all 128 days deliver, and days 123-128 first send 2027-02-02 through
   2027-02-09 — the old 122-deck wrap point, exactly where they should land. See the
   comment above ROTATION_ANCHOR in route.js.`,
  ],
  // 5. add-days.mjs only restamps when asked
  [
    'Use `tools/qa/add-days.mjs`, which appends entries, numbers them, restamps `ROTATION_ANCHOR` and validates word counts, domain/code agreement, verbatim task text, option labelling and citation reuse before writing.',
    'Use `tools/qa/add-days.mjs`, which appends entries, numbers them, and validates word counts, domain/code agreement, verbatim task text, option labelling and citation reuse before writing. It restamps `ROTATION_ANCHOR` **only** if you pass `--anchor DATE:NUM`; per rule 3 above, usually you should not.',
  ],
  // 6. answer-key balance is stale every wave
  [
    'The deck is deliberately balanced: correct answers are exactly 84/84/84/84 across A–D, and 28/28/28/28 within each of the three question slots.',
    'The deck is deliberately balanced: as of Wave 3 (128 days, 384 questions) correct answers are exactly 96/96/96/96 across A–D, and near-uniform within each of the three question slots (33/32/31/32, 31/32/33/32, 32/32/32/32). Recompute rather than trusting this line — it has gone stale after every wave.',
  ],
  // 7. THE OTHER DANGEROUS ONE — checklist repeated the wrong rule
  [
    '- `ROTATION_ANCHOR` restamped if `DAYS.length` changed.',
    '- `ROTATION_ANCHOR` left alone unless it is genuinely stale — see rule 3 under "Where to insert". Restamping a correct anchor moves the counter and is itself the bug.',
  ],
];

let text = fs.readFileSync(SKILL, 'utf8');
const problems = [];
edits.forEach(([from], i) => {
  const n = text.split(from).length - 1;
  if (n !== 1) problems.push(`edit ${i + 1}: expected exactly 1 match, found ${n} — first 60 chars: ${JSON.stringify(from.slice(0, 60))}`);
});
if (problems.length) {
  console.error('REFUSING — the skill does not look the way this patch expects.\n' + problems.map(p => '  - ' + p).join('\n'));
  console.error('\nNothing was written. The skill may already be patched, or it changed underneath this script.');
  process.exit(1);
}

for (const [from, to] of edits) text = text.replace(from, to);
fs.writeFileSync(SKILL, text);
console.log(`Patched ${SKILL} — ${edits.length} edits applied.`);
console.log('  1. deck size 122 -> 128');
console.log('  2. FIXED WRONG RULE: numbered item 3 told readers to always restamp ROTATION_ANCHOR');
console.log('  3. adjacency violation note now covers Wave 3 (twelve straight single-domain days)');
console.log('  4. anchor status note updated to Wave 3, with the verification that was actually run');
console.log('  5. add-days.mjs only restamps with --anchor');
console.log('  6. answer balance 84/84/84/84 -> 96/96/96/96 plus per-slot counts');
console.log('  7. FIXED WRONG RULE: "Before finishing" checklist repeated the bad restamp rule');
console.log('\nEdits 2 and 7 are the important ones: the skill stated the WRONG anchor rule in two');
console.log('places, with the correction buried between them. A session following either would');
console.log('have moved the rotation counter for every subscriber.');
