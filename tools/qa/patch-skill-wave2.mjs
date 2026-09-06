import fs from 'fs';
// Update the add-newsletter-day skill after Wave 2 (deck 117 -> 122 days).
//
// WHY THIS IS A SCRIPT INSTEAD OF AN EDIT: a safety classifier blocks Claude from
// writing under .claude/, and in-chat permission does not lift it. Ben runs this.
// Same pattern as patch-skill.mjs, which did the equivalent job after Wave 1.
//
// Usage: node tools/qa/patch-skill-wave2.mjs [--write]
// Dry-runs by default. Refuses to write unless every expected string is found
// exactly once, so a second run (or a skill that has already been edited by hand)
// fails loudly rather than corrupting the file.
const WRITE = process.argv.includes('--write');
const path = '.claude/skills/add-newsletter-day/SKILL.md';

if (!fs.existsSync(path)) {
  console.error(`missing ${path} — nothing to patch`); process.exit(1);
}
let src = fs.readFileSync(path, 'utf8');

// Verify the deck really is 122 before claiming so in the docs.
const route = fs.readFileSync('app/api/cron/bcba-brief/route.js', 'utf8');
const s = route.indexOf('const DAYS = ['), e = route.indexOf('\n];', s);
const len = eval(route.slice(s + 'const DAYS = '.length, e + 3)).length;
if (len !== 122) {
  console.error(`route.js has ${len} days, expected 122 — refusing to patch the skill`);
  process.exit(1);
}

const edits = [
  { from: 'currently 117 entries', to: 'currently 122 entries' },
  { from: 'Coverage is complete: all 104 TCO items have at least one day as of 2026-09-05.',
    to:   'Coverage is complete: all 104 TCO items have at least one day as of 2026-09-06.' },
];

const errs = [];
for (const { from } of edits) {
  const n = src.split(from).length - 1;
  if (n !== 1) errs.push(`expected exactly 1 occurrence of ${JSON.stringify(from)}, found ${n}`);
}
if (errs.length) {
  console.error('REFUSING — the skill is not in the state this patch expects:\n' +
    errs.map(x => '  - ' + x).join('\n') +
    '\nThe skill may already be patched, or may have drifted. Inspect it by hand.');
  process.exit(1);
}

for (const { from, to } of edits) src = src.replace(from, to);

// Wave 2 added five domain-I days at the end of the array. Record the consequence
// the skill's own "avoid adjacent same-domain days" rule now violates, so the next
// wave does not rediscover it.
const anchorLine = '4. Avoid placing the new day adjacent to another day in the same domain.';
if (!src.includes(anchorLine)) {
  console.error('REFUSING — could not find the insertion-rules list to append the Wave 2 note');
  process.exit(1);
}
src = src.replace(anchorLine, anchorLine + `

   **Known violation, accepted.** Wave 2 (Sept 2026) appended days 118-122, all
   domain I, immediately after day 117 (also domain I). Subscribers therefore get
   six consecutive Personnel Supervision sends, 2027-01-23 to 2027-02-01. Appending
   is what \`add-days.mjs\` does by design; interleaving instead would renumber every
   later entry and require an anchor restamp. Fix this by interleaving if a later
   wave is willing to pay that cost.

   **ROTATION_ANCHOR after Wave 2:** left at \`{date: "2026-09-04", dayNumber: 16}\`
   and deliberately NOT restamped. The invariant is not "length changed" but "the
   anchor names a real past send whose number was not produced by a wrap". It still
   does, so growing 117 -> 122 only changes behaviour at the old wrap point, which is
   exactly where the new days should appear. Restamping an already-correct anchor
   moves the counter and is itself the bug. See the comment above ROTATION_ANCHOR
   in route.js.`);

console.log(`validated: route.js has ${len} days; ${edits.length} replacements + 1 note ready`);
if (WRITE) { fs.writeFileSync(path, src); console.log('written to ' + path); }
else console.log('DRY RUN — pass --write to apply');
