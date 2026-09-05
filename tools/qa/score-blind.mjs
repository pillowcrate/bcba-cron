import fs from 'fs';
const key = JSON.parse(fs.readFileSync('.bcba-build/blind-key.json','utf8'));
const orig = new Map(JSON.parse(fs.readFileSync('.bcba-build/all-questions.json','utf8')).map(o=>[o.id,o]));
let ans=[];
for (const f of fs.readdirSync('.bcba-build').filter(f=>/^answers-\d+\.json$/.test(f)).sort())
  ans.push(...JSON.parse(fs.readFileSync('.bcba-build/'+f,'utf8')));

const toOrig = (id,letter) => key[id]?.['ABCD'.indexOf(letter)];
const disagree=[], ambiguous=[], lowconf=[];
let n=0, agree=0;
for (const a of ans) {
  const o = orig.get(a.id); if (!o) { console.log('unknown id',a.id); continue; }
  n++;
  const picked = toOrig(a.id, a.pick);
  if (picked === o.answer) agree++;
  else disagree.push({id:a.id, picked, keyed:o.answer, conf:a.confidence, note:a.note||''});
  const def = (a.defensible||[]).map(l=>toOrig(a.id,l)).filter(Boolean);
  if (def.length > 1) ambiguous.push({id:a.id, def:def.join('+'), keyed:o.answer, note:a.note||''});
  if (a.confidence === 'low') lowconf.push(a.id);
}
console.log(`blind answers scored: ${n} / 129`);
console.log(`agreed with the key: ${agree} (${(100*agree/n).toFixed(1)}%)`);
console.log(`\nDISAGREED WITH KEY (${disagree.length}) — these need a human decision:`);
disagree.forEach(d=>console.log(`  ✗ ${d.id}: blind picked ${d.picked}, key says ${d.keyed} [${d.conf}] ${d.note}`));
console.log(`\nMORE THAN ONE DEFENSIBLE OPTION (${ambiguous.length}):`);
ambiguous.forEach(d=>console.log(`  ! ${d.id}: defensible ${d.def}, keyed ${d.keyed} — ${d.note}`));
console.log(`\nlow confidence (${lowconf.length}): ${lowconf.join(', ')}`);
const missing = Object.keys(key).filter(id=>!ans.some(a=>a.id===id));
if (missing.length) console.log(`\nNOT ANSWERED (${missing.length}): ${missing.join(', ')}`);
