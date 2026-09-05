import fs from 'fs';
const src = fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const s=src.indexOf('const DAYS = ['), e=src.indexOf('\n];',s);
const arr = eval(src.slice(s+'const DAYS = '.length, e+3));
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
const gaps=[];
for (const d of arr) for (const q of d.questions){
  const i='ABCD'.indexOf(q.answer); const L=q.options.map(o=>strip(o).length);
  gaps.push(L[i]-Math.max(...L.filter((_,j)=>j!==i)));
}
const off=gaps.filter(g=>g>0).sort((a,b)=>b-a);
console.log('offenders:',off.length);
[50,100,150,200].forEach(k=>console.log(`gap at rank ${k}: +${off[k-1]} chars (~${Math.round(off[k-1]/5.5)} words)`));
console.log('gap >=30 chars:', off.filter(g=>g>=30).length, '| >=15:', off.filter(g=>g>=15).length, '| >=8:', off.filter(g=>g>=8).length);
