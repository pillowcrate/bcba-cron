import fs from 'fs';
const path='app/api/cron/bcba-brief/route.js';
let s=fs.readFileSync(path,'utf8');
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
const subs=[
  ["B. The behavior keeps producing reinforcement at a lower rate",
   "B. It lets the behavior keep producing reinforcement at a lower rate"],            // d43q3
  ["D. An instructor-paced unit bounded by an intertrial interval",
   "D. The use of instructor-paced trials bounded by an intertrial interval"],          // d54q1
  ["C. New topographies may emerge within the same response class",
   "C. It allows new topographies to emerge in the same response class"],               // d81q3
  ["B. The terminal reinforcer follows the last step on every trial",
   "B. It ensures the terminal reinforcer follows the last step every trial"],          // d84q2
  ["D. The models were faded gradually in intensity across trials",
   "D. Models were faded gradually in intensity across trials"],                        // d102q2 (distractor)
  ["C. Serve as the discriminative stimulus evoking the response",
   "C. Be the discriminative stimulus that evokes the response"],                       // d102q3
  ["D. A generalized listener response",
   "D. An untrained listener response"],                                                // d36q3 (distractor)
];
for (const [o,n] of subs) {
  const c = s.split(o).length-1;
  if (c!==1) { console.log(`ABORT: "${o.slice(0,45)}…" found ${c}x`); process.exit(1); }
  s = s.replace(o,n);
}
fs.writeFileSync(path,s);
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const arr=eval(s.slice(a+'const DAYS = '.length,b+3));
let fail=0;
for (const [day,qi] of [[43,2],[54,0],[81,2],[84,1],[102,1],[102,2],[36,2]]) {
  const q=arr.find(d=>d.day===day).questions[qi];
  const L=q.options.map(o=>strip(o).length), i='ABCD'.indexOf(q.answer);
  const bad=L[i]>Math.max(...L.filter((_,j)=>j!==i));
  if (bad) fail++;
  console.log(`d${day}q${qi+1} keyed ${q.answer} ${L.join('/')} unique-longest:${bad?'YES (FAIL)':'no'} spread ${(Math.max(...L)/Math.min(...L)).toFixed(2)}x`);
}
process.exit(fail?1:0);
