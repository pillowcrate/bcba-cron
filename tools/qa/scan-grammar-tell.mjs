import fs from 'fs';
const s=fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const arr=eval(s.slice(a+'const DAYS = '.length,b+3));
// applied-ids.json only exists mid-fix-run; without it, every flag reads as pre-existing
const touched=new Set(fs.existsSync('.bcba-build/applied-ids.json')
  ? JSON.parse(fs.readFileSync('.bcba-build/applied-ids.json','utf8')) : []);
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
const fw=x=>strip(x).replace(/^[‘'"]/,'').split(/\s+/)[0].replace(/[^A-Za-z']/g,'');
const flags=[];
for (const d of arr) for (const [qi,q] of d.questions.entries()) {
  const id=`d${d.day}q${qi+1}`, i='ABCD'.indexOf(q.answer);
  const W=q.options.map(fw), dW=W.filter((_,j)=>j!==i), cW=W[i];
  const shape=w=>({ verbS: /s$/i.test(w)&&!/^(the|a|an|its|this)$/i.test(w), the: /^the$/i.test(w), ing: /ing$/i.test(w) });
  const cs=shape(cW), ds=dW.map(shape);
  const reasons=[];
  if (dW.every(w=>w.toLowerCase()===dW[0].toLowerCase()) && cW.toLowerCase()!==dW[0].toLowerCase())
    reasons.push(`all 3 distractors start "${dW[0]}", correct starts "${cW}"`);
  if (ds.every(x=>x.verbS) && !cs.verbS) reasons.push(`distractors are verb-initial (-s), correct is not ("${cW}")`);
  if (ds.every(x=>x.the) && !cs.the) reasons.push(`distractors start "The", correct starts "${cW}"`);
  if (ds.every(x=>x.ing) && !cs.ing) reasons.push(`distractors are -ing gerunds, correct starts "${cW}"`);
  if (reasons.length) flags.push({id, touched:touched.has(id), stem:q.q, ans:q.answer, opts:q.options, reasons});
}
const t=flags.filter(f=>f.touched), u=flags.filter(f=>!f.touched);
console.log(`first-word outlier flags: ${flags.length} total — ${t.length} in questions I rewrote, ${u.length} pre-existing\n`);
for (const f of t) {
  console.log(`--- ${f.id} (REWRITTEN) keyed ${f.ans}: ${f.reasons.join('; ')}`);
  console.log(`    ${f.stem}`); f.opts.forEach(o=>console.log('      '+o));
}
console.log(`\npre-existing (not touched by this change): ${u.map(f=>f.id).join(', ')||'none'}`);
