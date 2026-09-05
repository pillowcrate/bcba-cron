import fs from 'fs';
const src=fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const s=src.indexOf('const DAYS = ['), e=src.indexOf('\n];',s);
const arr=eval(src.slice(s+'const DAYS = '.length, e+3));
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
// proxy for jargon density: count of words >= 10 chars
const jarg=x=>strip(x).split(/\s+/).filter(w=>w.replace(/[^A-Za-z-]/g,'').length>=10).length;
let n=0, most=0, tied=0;
for (const d of arr) for (const q of d.questions){
  n++; const i='ABCD'.indexOf(q.answer); const J=q.options.map(jarg);
  const max=Math.max(...J); if (J[i]===max) { if (J.filter(x=>x===max).length===1) most++; else tied++; }
}
console.log(`jargon tell (correct option has strictly the most 10+ letter words): ${most}/${n} = ${(100*most/n).toFixed(1)}%  (chance ~25%; +${tied} tied)`);
