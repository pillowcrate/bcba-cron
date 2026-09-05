import fs from 'fs';
fs.mkdirSync('.bcba-build', {recursive:true});
const path='app/api/cron/bcba-brief/route.js';
const src=fs.readFileSync(path,'utf8');
const lines=src.split('\n');
const s=src.indexOf('const DAYS = ['), e=src.indexOf('\n];',s);
const arr=eval(src.slice(s+'const DAYS = '.length, e+3));
const strip=x=>x.replace(/^[A-D]\.\s*/,'');

// map each question object to its 1-based line number by exact stem match
const qLines=[];
lines.forEach((l,i)=>{ if(/^      \{ q: "/.test(l)) qLines.push(i+1); });
// derived, not hardcoded, so this still guards correctly if the deck grows past 112 days
const expected=arr.reduce((n,d)=>n+d.questions.length,0);
if (qLines.length!==expected) throw new Error(`line count mismatch: matched ${qLines.length} stem lines, DAYS has ${expected} questions`);

let k=0; const all=[];
for (const d of arr) for (const [qi,q] of d.questions.entries()) {
  const line=qLines[k++];
  const idx='ABCD'.indexOf(q.answer);
  const L=q.options.map(o=>strip(o).length);
  const gap=L[idx]-Math.max(...L.filter((_,j)=>j!==idx));
  all.push({id:`d${d.day}q${qi+1}`, line, gap, day:d.day, domain:d.domain, taskCode:d.taskCode,
    conceptTitle:d.concept.title, concept:d.concept.body,
    q:q.q, options:q.options, answer:q.answer, rationale:q.rationale, lens:L});
  // sanity: the stem must appear on that line
  if (!lines[line-1].includes(q.q.slice(0,40).replace(/"/g,'\\"'))) throw new Error('stem mismatch at line '+line+' for '+d.day);
}
const targets=all.filter(t=>t.gap>=15).sort((a,b)=>a.line-b.line);
fs.writeFileSync('.bcba-build/targets.json', JSON.stringify(targets,null,1));
fs.writeFileSync('.bcba-build/all-questions.json', JSON.stringify(all,null,1));
// batch
const N=8, batches=Array.from({length:N},()=>[]);
targets.forEach((t,i)=>batches[i%N].push(t));
batches.forEach((b,i)=>fs.writeFileSync(`.bcba-build/batch-${String(i+1).padStart(2,'0')}.json`, JSON.stringify(b,null,1)));
console.log('targets:',targets.length,'batches:',N,'sizes:',batches.map(b=>b.length).join(','));
if (targets.length) console.log('line range:',targets[0].line,'-',targets[targets.length-1].line);
else console.log('no questions exceed the gap threshold — nothing to rewrite');
