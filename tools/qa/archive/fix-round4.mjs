import fs from 'fs';
const path='app/api/cron/bcba-brief/route.js';
let s=fs.readFileSync(path,'utf8');
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
const subs=[
  ["A. It eliminates the behavior more rapidly and more completely",
   "A. It eliminates the target behavior more rapidly and more completely"],
  ["D. It removes the need for ongoing response-rate data",
   "D. It removes the need to collect ongoing response-rate data"],
  ["A. The delivery of reinforcement after correct responses",
   "A. The delivery of reinforcement following correct responses"],
  ["B. The use of a discriminative stimulus to occasion responding",
   "B. The use of a discriminative stimulus to occasion each response"],
  ["D. The use of instructor-paced trials bounded by an intertrial interval",
   "D. The instructor-paced trial bounded by an intertrial interval"],
  ["B. It ensures the terminal reinforcer follows the last step every trial",
   "B. It ensures the terminal reinforcer follows the final step"],
];
for (const [o,n] of subs) {
  const c=s.split(o).length-1;
  if (c!==1){ console.log(`ABORT: "${o.slice(0,45)}…" ${c}x`); process.exit(1);}
  s=s.replace(o,n);
}
fs.writeFileSync(path,s);
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const arr=eval(s.slice(a+'const DAYS = '.length,b+3));
let fail=0;
for (const [day,qi] of [[43,2],[54,0],[84,1]]) {
  const q=arr.find(d=>d.day===day).questions[qi];
  const L=q.options.map(o=>strip(o).length), i='ABCD'.indexOf(q.answer);
  const bad=L[i]>Math.max(...L.filter((_,j)=>j!==i)); if(bad) fail++;
  console.log(`d${day}q${qi+1} keyed ${q.answer} ${L.join('/')} unique-longest:${bad?'YES (FAIL)':'no'} spread ${(Math.max(...L)/Math.min(...L)).toFixed(2)}x`);
  q.options.forEach(o=>console.log('    '+o));
}
process.exit(fail?1:0);
