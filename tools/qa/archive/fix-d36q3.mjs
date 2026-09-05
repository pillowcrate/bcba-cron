import fs from 'fs';
const path='app/api/cron/bcba-brief/route.js';
let s=fs.readFileSync(path,'utf8');
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
const subs=[
  // "car" has no point-to-point correspondence with "What do you want?", so the response
  // cannot be an echoic. Drop the false disjunct from the keyed option.
  ["B. An intraverbal or echoic under instructional control",
   "B. An intraverbal evoked by the therapist's verbal question"],
  ["If the verbal prompt is the only thing evoking the response, it is under instructional (verbal) control — functioning as an intraverbal or echoic — not under MO control. A true mand occurs when the item is wanted, independent of a verbal prompt.",
   "If the verbal prompt is the only thing evoking the response, it is under verbal instructional control — an intraverbal — not MO control. A true mand occurs when the item is wanted, independent of a verbal prompt."],
];
for (const [o,n] of subs){ const c=s.split(o).length-1; if(c!==1){console.log(`ABORT "${o.slice(0,45)}…" found ${c}x`);process.exit(1);} s=s.replace(o,n); }
fs.writeFileSync(path,s);
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const q=eval(s.slice(a+'const DAYS = '.length,b+3)).find(d=>d.day===36).questions[2];
const L=q.options.map(o=>strip(o).length), i='ABCD'.indexOf(q.answer);
const bad=L[i]>Math.max(...L.filter((_,j)=>j!==i));
q.options.forEach(o=>console.log('  ['+strip(o).length+'] '+o));
console.log(`keyed ${q.answer} | unique-longest: ${bad?'YES (FAIL)':'no'} | spread ${(Math.max(...L)/Math.min(...L)).toFixed(2)}x | rationale ${q.rationale.trim().split(/\s+/).length} words`);
console.log('RATIONALE:', q.rationale);
process.exit(bad?1:0);
