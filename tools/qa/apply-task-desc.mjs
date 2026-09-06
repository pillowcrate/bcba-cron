import fs from 'fs';
// Rewrite every day's taskDesc to the verbatim 6th-edition outline text for the
// code that day already carries. taskDesc is internal metadata — it is not rendered
// in the email (only taskCode and domain are), so this changes nothing subscribers see.
// Composite codes ("B.12/B.13") get both items' text joined.
// Pass --write to apply; default is a dry run.
const WRITE = process.argv.includes('--write');
const path = 'app/api/cron/bcba-brief/route.js';
const TCO = JSON.parse(fs.readFileSync('tools/qa/tco-6th-ed.json', 'utf8'));
const lines = fs.readFileSync(path, 'utf8').split('\n');

let day = null, changed = 0, unchanged = 0, unknown = [];
const changes = [];
for (let i = 0; i < lines.length; i++) {
  const dm = lines[i].match(/^\s*day: (\d+), domain: "([^"]*)", taskCode: "([^"]*)",/);
  if (dm) { day = { n: +dm[1], code: dm[3] }; continue; }
  const tm = lines[i].match(/^(\s*)taskDesc: "(.*)",?$/);
  if (!tm || !day) continue;

  const codes = day.code.split('/').map(p => (p.trim().match(/^[A-I]\.\d+/) || [])[0]).filter(Boolean);
  if (!codes.length) { unknown.push(day.n); day = null; continue; }
  const miss = codes.filter(c => !TCO[c]);
  if (miss.length) { unknown.push(`${day.n} (${miss.join(',')})`); day = null; continue; }

  const want = codes.map(c => TCO[c]).join(' ');
  const have = tm[2];
  if (have === want) unchanged++;
  else {
    changed++;
    changes.push({ day: day.n, code: day.code, from: have, to: want });
    lines[i] = `${tm[1]}taskDesc: ${JSON.stringify(want)},`;
  }
  day = null;
}

console.log(`${WRITE ? 'APPLIED' : 'DRY RUN'} — rewrote ${changed}, already correct ${unchanged}`);
if (unknown.length) console.log(`!! could not resolve a code for days: ${unknown.join(', ')}`);
for (const c of changes) {
  console.log(`\nday ${c.day} [${c.code}]`);
  console.log(`  was:  ${c.from}`);
  console.log(`  now:  ${c.to}`);
}
if (WRITE) { fs.writeFileSync(path, lines.join('\n')); console.log('\nwritten to ' + path); }
