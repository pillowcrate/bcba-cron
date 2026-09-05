import fs from 'fs';
fs.mkdirSync('.bcba-build', {recursive:true});
// Build blind answer-key-free question sets for the verification pass.
// Reads the CURRENT route.js, so run this AFTER apply.
const src=fs.readFileSync('app/api/cron/bcba-brief/route.js','utf8');
const s=src.indexOf('const DAYS = ['), e=src.indexOf('\n];',s);
const arr=eval(src.slice(s+'const DAYS = '.length, e+3));
const touched=new Set(JSON.parse(fs.readFileSync('.bcba-build/applied-ids.json','utf8')));
const out=[];
for (const d of arr) for (const [qi,q] of d.questions.entries()) {
  const id=`d${d.day}q${qi+1}`;
  if (!touched.has(id)) continue;
  // options shuffled deterministically by id hash so position carries no information
  let h=0; for (const c of id) h=(h*31+c.charCodeAt(0))>>>0;
  const idxs=[0,1,2,3];
  for (let i=3;i>0;i--){ h=(h*1103515245+12345)>>>0; const j=h%(i+1); [idxs[i],idxs[j]]=[idxs[j],idxs[i]]; }
  out.push({ id, domain:d.domain, taskCode:d.taskCode,
    q:q.q,
    choices: idxs.map((oi,k)=>`${'ABCD'[k]}. ${q.options[oi].replace(/^[A-D]\.\s*/,'')}`),
    _map: idxs.map(oi=>'ABCD'[oi])   // stripped before writing
  });
}
const N=6, batches=Array.from({length:N},()=>[]);
out.forEach((t,i)=>batches[i%N].push(t));
const key={};
batches.forEach((b,i)=>{
  b.forEach(t=>{ key[t.id]=t._map; });
  fs.writeFileSync(`.bcba-build/blind-${String(i+1).padStart(2,'0')}.json`,
    JSON.stringify(b.map(({_map,...rest})=>rest),null,1));
});
fs.writeFileSync('.bcba-build/blind-key.json', JSON.stringify(key,null,1));
console.log('blind questions:',out.length,'in',N,'files; sizes:',batches.map(b=>b.length).join(','));
