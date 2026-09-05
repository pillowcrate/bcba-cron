import fs from 'fs';
const src = fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const start = src.indexOf('const DAYS = [');
const end = src.indexOf('\n];', start);
const arr = eval(src.slice(start + 'const DAYS = '.length, end+3));

const strip = s => s.replace(/^[A-D]\.\s*/,'');
const words = s => strip(s).trim().split(/\s+/).length;
const chars = s => strip(s).trim().length;

let n=0, longestUnique=0, longestTied=0, shortest=0;
const byLetter = {A:0,B:0,C:0,D:0};
const deltas=[];
const offenders=[];
for (const d of arr) {
  for (const [qi,q] of d.questions.entries()) {
    n++;
    const idx = 'ABCD'.indexOf(q.answer);
    byLetter[q.answer]++;
    const w = q.options.map(chars);
    const max = Math.max(...w), min = Math.min(...w);
    const isMax = w[idx]===max;
    const ties = w.filter(x=>x===max).length;
    if (isMax && ties===1) { longestUnique++; offenders.push({day:d.day,qi,ans:q.answer,correct:w[idx],others:w.filter((_,i)=>i!==idx)}); }
    else if (isMax) longestTied++;
    if (w[idx]===min) shortest++;
    const otherMean = w.filter((_,i)=>i!==idx).reduce((a,b)=>a+b,0)/3;
    deltas.push(w[idx]-otherMean);
  }
}
deltas.sort((a,b)=>a-b);
console.log('days', arr.length, 'questions', n);
console.log('correct is UNIQUELY longest:', longestUnique, (100*longestUnique/n).toFixed(1)+'%');
console.log('correct is longest incl ties:', longestUnique+longestTied, (100*(longestUnique+longestTied)/n).toFixed(1)+'%');
console.log('correct is shortest:', shortest, (100*shortest/n).toFixed(1)+'%');
console.log('answer letter dist:', byLetter);
console.log('char delta (correct - mean distractor): median', deltas[Math.floor(n/2)].toFixed(0), 'mean', (deltas.reduce((a,b)=>a+b,0)/n).toFixed(0), 'p10', deltas[Math.floor(n*0.1)].toFixed(0), 'p90', deltas[Math.floor(n*0.9)].toFixed(0));
// how many offenders would be fixed by padding distractors by <= X chars
for (const pad of [10,20,30,40,60]) {
  const fixable = offenders.filter(o => (o.correct - Math.max(...o.others)) <= pad).length;
  console.log(`offenders where correct exceeds next-longest by <= ${pad} chars:`, fixable);
}
