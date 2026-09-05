import fs from 'fs';
const DRY = process.argv.includes('--dry-run');
const path = 'app/api/cron/bcba-brief/route.js';
const orig = JSON.parse(fs.readFileSync('.bcba-build/all-questions.json','utf8'));
const byId = new Map(orig.map(o=>[o.id,o]));
const strip = x => x.replace(/^[A-D]\.\s*/,'');

let rewrites=[];
for (const f of fs.readdirSync('.bcba-build').filter(f=>/^rewrite-\d+\.json$/.test(f)).sort()) {
  const j = JSON.parse(fs.readFileSync('.bcba-build/'+f,'utf8'));
  j.forEach(r=>r._src=f);
  rewrites.push(...j);
}

const errs=[], warns=[], ok=[];
const seen=new Set();
for (const r of rewrites) {
  const o = byId.get(r.id);
  const E = m => errs.push(`${r.id} (${r._src}): ${m}`);
  if (!o) { E('unknown id'); continue; }
  if (seen.has(r.id)) warns.push(`${r.id}: appears in more than one batch — later file (${r._src}) wins`);
  seen.add(r.id);
  if (r.line !== o.line) E(`line mismatch: got ${r.line}, expected ${o.line}`);
  if (r.answer !== o.answer) E(`answer letter changed ${o.answer} -> ${r.answer}`);
  if (!Array.isArray(r.options) || r.options.length !== 4) { E('not 4 options'); continue; }
  r.options.forEach((opt,i)=>{ if (!opt.startsWith('ABCD'[i]+'. ')) E(`option ${i} missing "${'ABCD'[i]}. " prefix`); });
  if (r.q && r.q !== o.q) warns.push(`${r.id}: stem was changed`);
  const L = r.options.map(x=>strip(x).length);
  const unreported = !r.lens || r.lens.every(x=>!x);
  if (unreported) warns.push(`${r.id}: did not self-report lens (verified independently)`);
  else if (JSON.stringify(r.lens)!==JSON.stringify(L)) E(`self-reported lens ${JSON.stringify(r.lens)} != actual ${JSON.stringify(L)}`);
  const idx = 'ABCD'.indexOf(r.answer);
  const others = L.filter((_,i)=>i!==idx);
  if (L[idx] > Math.max(...others)) E(`correct option still the unique longest (${L[idx]} vs ${Math.max(...others)})`);
  const spread = Math.max(...L)/Math.min(...L);
  if (spread > 1.25) warns.push(`${r.id}: length spread ${spread.toFixed(2)}x exceeds 1.25 target (${L.join('/')})`);
  const rw = (r.rationale||o.rationale).trim().split(/\s+/).length;
  if (rw < 18 || rw > 48) warns.push(`${r.id}: rationale ${rw} words (target 24-38)`);
  if (new Set(r.options.map(x=>strip(x).toLowerCase())).size !== 4) E('duplicate option text');
  if (r.options.some(x=>/\b(all|none) of the above|both a and b/i.test(x))) E('forbidden option form');
  if (!errs.some(e=>e.startsWith(r.id+' '))) ok.push(r);
}

console.log(`rewrites received: ${rewrites.length} / 129 targets`);
console.log(`passing validation: ${ok.length}`);
if (errs.length) { console.log(`\nERRORS (${errs.length}) — these will NOT be applied:`); errs.forEach(e=>console.log('  ✗ '+e)); }
if (warns.length) { console.log(`\nwarnings (${warns.length}):`); warns.forEach(w=>console.log('  ! '+w)); }
const missing = orig.filter(o=>o.gap>=15 && !seen.has(o.id)).map(o=>o.id);
if (missing.length) console.log(`\nnot rewritten (${missing.length}): ${missing.join(', ')}`);

if (DRY) { console.log('\n[dry run] nothing written'); process.exit(errs.length?1:0); }

const finalById = new Map(); for (const r of ok) finalById.set(r.id, r);
const finalOk = [...finalById.values()];
fs.writeFileSync('.bcba-build/applied-ids.json', JSON.stringify(finalOk.map(r=>r.id),null,1));
fs.copyFileSync(path, '.bcba-build/route.js.bak-lengthfix');
const lines = fs.readFileSync(path,'utf8').split('\n');
for (const r of finalOk) {
  const cur = lines[r.line-1];
  const trailing = cur.trimEnd().endsWith(',') ? ',' : '';
  const o = byId.get(r.id);
  lines[r.line-1] = '      { q: ' + JSON.stringify(r.q ?? o.q)
    + ', options: [' + r.options.map(x=>JSON.stringify(x)).join(', ') + ']'
    + ', answer: ' + JSON.stringify(r.answer)
    + ', rationale: ' + JSON.stringify(r.rationale ?? o.rationale) + ' }' + trailing;
}
fs.writeFileSync(path, lines.join('\n'));
console.log(`\napplied ${finalOk.length} rewrites to ${path} (backup: .bcba-build/route.js.bak-lengthfix)`);
