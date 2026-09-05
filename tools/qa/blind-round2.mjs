import fs from 'fs';
fs.mkdirSync('.bcba-build', {recursive:true});
const s=fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const a=s.indexOf('const DAYS = ['),b=s.indexOf('\n];',a);
const arr=eval(s.slice(a+'const DAYS = '.length,b+3));
const items=[[47,2],[34,2],[1,1],[30,1],[43,2],[54,0],[81,2],[84,1],[102,1],[102,2],[36,2]];
const perms={A:[2,0,3,1], B:[1,3,0,2]};
for (const tag of ['A','B']) {
  const perm=perms[tag], out=[], key={};
  for (const [day,qi] of items) {
    const d=arr.find(x=>x.day===day), q=d.questions[qi], id=`d${day}q${qi+1}`;
    out.push({id, domain:d.domain, taskCode:d.taskCode, q:q.q,
      choices: perm.map((oi,k)=>`${'ABCD'[k]}. ${q.options[oi].replace(/^[A-D]\.\s*/,'')}`)});
    key[id]=perm.map(oi=>'ABCD'[oi]);
  }
  fs.writeFileSync(`.bcba-build/blind-r2${tag}.json`, JSON.stringify(out,null,1));
  fs.writeFileSync(`.bcba-build/blind-r2${tag}-key.json`, JSON.stringify(key,null,1));
}
console.log('wrote blind-r2A / blind-r2B with', items.length, 'questions each, different shuffles');
