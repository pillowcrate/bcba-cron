import fs from 'fs';
const src = fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const start = src.indexOf('const DAYS = [');
const end = src.indexOf('\n];', start);
const arr = eval(src.slice(start + 'const DAYS = '.length, end+3));
const strip = s => s.replace(/^[A-D]\.\s*/,'');
const rows=[];
for (const d of arr) for (const [qi,q] of d.questions.entries()) {
  const idx='ABCD'.indexOf(q.answer);
  const L=q.options.map(o=>strip(o).length);
  const gap = L[idx]-Math.max(...L.filter((_,i)=>i!==idx));
  rows.push({d:d.day,qi,gap,q,L,idx});
}
rows.sort((a,b)=>b.gap-a.gap);
for (const r of rows.slice(0,4)) {
  console.log(`--- Day ${r.d} Q${r.qi+1}  gap=+${r.gap} chars  answer=${r.q.answer}`);
  console.log('   ', r.q.q);
  r.q.options.forEach((o,i)=>console.log(`    ${i===r.idx?'*':' '} [${r.L[i]}] ${o}`));
  console.log('    RATIONALE:', r.q.rationale);
}
// rationale coupling: how many rationales name a distractor's distinctive words
let coupled=0;
for (const r of rows) {
  const others = r.q.options.filter((_,i)=>i!==r.idx).map(strip);
  const rat = r.q.rationale.toLowerCase();
  if (others.some(o => { const t=o.toLowerCase().split(/\s+/).filter(w=>w.length>6); return t.length && t.filter(w=>rat.includes(w)).length>=2; })) coupled++;
}
console.log('\nquestions whose rationale explicitly discusses distractor wording:', coupled, 'of', rows.length);
