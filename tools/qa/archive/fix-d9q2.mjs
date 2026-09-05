import fs from 'fs';
const path='app/api/cron/bcba-brief/route.js';
let s=fs.readFileSync(path,'utf8');
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
const m = s.match(/C\. Abolishing the motivating operation for escape from demands/);
if (!m) { console.log('target not found'); process.exit(1); }
const cur = m[0];
// Replace the competing-account distractor with escape extinction: a real, different
// procedure that high-p sequences do NOT use, so it cannot be defended as the mechanism.
const repl = 'C. Preventing escape from the demand until compliance occurs';
if (s.split(cur).length !== 2) { console.log('not unique'); process.exit(1); }
s = s.replace(cur, repl);
fs.writeFileSync(path, s);
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const q=eval(s.slice(a+'const DAYS = '.length,b+3)).find(d=>d.day===9).questions[1];
q.options.forEach(o=>console.log(strip(o).length, o));
console.log('keyed:', q.answer);
console.log('RATIONALE:', q.rationale);
