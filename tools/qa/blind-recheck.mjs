import fs from 'fs';
fs.mkdirSync('.bcba-build', {recursive:true});
const s=fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const arr=eval(s.slice(a+'const DAYS = '.length,b+3));
const ids=[[75,2],[9,1]];
const out=[],key={};
for (const [day,qi] of ids){
  const d=arr.find(x=>x.day===day), q=d.questions[qi], id=`d${day}q${qi+1}`;
  const perm=[2,0,3,1];
  out.push({id, domain:d.domain, taskCode:d.taskCode, q:q.q,
    choices: perm.map((oi,k)=>`${'ABCD'[k]}. ${q.options[oi].replace(/^[A-D]\.\s*/,'')}`)});
  key[id]=perm.map(oi=>'ABCD'[oi]);
}
fs.writeFileSync('.bcba-build/blind-recheck.json', JSON.stringify(out,null,1));
fs.writeFileSync('.bcba-build/blind-recheck-key.json', JSON.stringify(key,null,1));
console.log('wrote recheck for', out.map(o=>o.id).join(', '));
