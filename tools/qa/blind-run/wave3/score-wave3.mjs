import fs from 'fs';
const key = JSON.parse(fs.readFileSync('.bcba-build/blind-key.json','utf8'));
const src = fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const s = src.indexOf('const DAYS = ['), e = src.indexOf('\n];', s);
const DAYS = eval(src.slice(s+'const DAYS = '.length, e+3));
const real = {};
for (const d of DAYS) d.questions.forEach((q,i)=>real['d'+d.day+'q'+(i+1)]=q.answer);
const picks = JSON.parse(fs.readFileSync('.bcba-build/wave3/picks.json','utf8'));
const dec = (id,l) => key[id]['ABCD'.indexOf(l)];
let ok=0,bad=0; const flags=[];
for (const p of picks) {
  const d = dec(p.id,p.pick), truth = real[p.id], hit = d===truth;
  hit?ok++:bad++;
  const defs = p.defensible.map(l=>dec(p.id,l));
  if (defs.length>1) flags.push(`${p.id}: defensible ${defs.join(' & ')} (key ${truth}), conf ${p.confidence}`);
  console.log(`${p.id}  blind ${p.pick} -> real ${d}   key ${truth}   ${hit?'OK':'*** MISMATCH ***'}   conf ${p.confidence.padEnd(6)} defensible[${defs.join(',')}]`);
}
console.log(`\nagreement: ${ok}/${ok+bad}`);
console.log(`items flagged with >1 defensible option: ${flags.length}`);
flags.forEach(f=>console.log('  - '+f));
