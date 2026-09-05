import fs from 'fs';
const path='app/api/cron/bcba-brief/route.js';
let s=fs.readFileSync(path,'utf8');
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
const subs=[
  // d54q1: "each response" made this distractor specifically true of DTT — revert to the original,
  // non-distinguishing wording, and take the needed length from distractor A instead.
  ["B. The use of a discriminative stimulus to occasion each response",
   "B. The use of a discriminative stimulus to occasion responding"],
  ["A. The delivery of reinforcement following correct responses",
   "A. The delivery of reinforcement immediately after correct responses"],
  // d84q2: shortening dropped "on every trial", which is the actual advantage of backward chaining.
  ["B. It ensures the terminal reinforcer follows the final step",
   "B. It lets the learner contact the terminal reinforcer every trial"],
  ["A. It requires fewer instructional sessions than forward chaining",
   "A. It requires fewer instructional sessions than forward chaining does"],
];
for (const [o,n] of subs){ const c=s.split(o).length-1; if(c!==1){console.log(`ABORT "${o.slice(0,40)}…" ${c}x`);process.exit(1);} s=s.replace(o,n); }
fs.writeFileSync(path,s);
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const arr=eval(s.slice(a+'const DAYS = '.length,b+3));
let fail=0;
for (const [day,qi] of [[54,0],[84,1]]) {
  const q=arr.find(d=>d.day===day).questions[qi];
  const L=q.options.map(o=>strip(o).length), i='ABCD'.indexOf(q.answer);
  const bad=L[i]>Math.max(...L.filter((_,j)=>j!==i)); if(bad)fail++;
  console.log(`d${day}q${qi+1} keyed ${q.answer} ${L.join('/')} unique-longest:${bad?'YES (FAIL)':'no'} spread ${(Math.max(...L)/Math.min(...L)).toFixed(2)}x`);
  q.options.forEach(o=>console.log('    '+o));
}
process.exit(fail?1:0);
