import fs from 'fs';
const path='app/api/cron/bcba-brief/route.js';
let s=fs.readFileSync(path,'utf8');
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
const subs = [
  // d47q3: keyed option must complete the stem "...primarily because it:" like the distractors do
  ["B. Each member earns reinforcement based only on their own behavior",
   "B. Ties each member's reinforcement to their own behavior alone"],
  // d34q3: rationale claimed 5 required elements while the keyed option lists 3
  ["Complete mastery criteria specify the metric, the criterion value, the number of consecutive sessions, the staff across whom consistency is required, and the settings — making mastery a data-based determination rather than a judgment call.",
   "Mastery criteria must at minimum specify the metric, the criterion value, and the number of consecutive sessions; a complete criterion also names the staff and settings across which it must hold."],
  // d1q2: distractors A and D asserted the same proposition, collapsing the item to a coin flip
  ["D. Produced functional conclusions equivalent to the analysis",
   "D. Overidentified automatic reinforcement as the maintaining function"],
  // d30q2: three distractors began "The <role>'s…" and only the keyed option did not
  ["B. Acquisition and the family's ability to maintain the skill",
   "B. The client's acquisition and the family's ability to maintain it"],
];
for (const [oldT,newT] of subs) {
  const n = s.split(oldT).length - 1;
  if (n !== 1) { console.log(`ABORT: "${oldT.slice(0,50)}…" found ${n} times`); process.exit(1); }
  s = s.replace(oldT, newT);
}
fs.writeFileSync(path, s);
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const arr=eval(s.slice(a+'const DAYS = '.length,b+3));
for (const [day,qi] of [[47,2],[34,2],[1,1],[30,1]]) {
  const q=arr.find(d=>d.day===day).questions[qi];
  const L=q.options.map(o=>strip(o).length), i='ABCD'.indexOf(q.answer);
  const longest = L[i]>Math.max(...L.filter((_,j)=>j!==i));
  console.log(`d${day}q${qi+1} keyed ${q.answer} lens ${L.join('/')} — correct is unique longest: ${longest?'YES (FAIL)':'no'}  spread ${(Math.max(...L)/Math.min(...L)).toFixed(2)}x`);
}
