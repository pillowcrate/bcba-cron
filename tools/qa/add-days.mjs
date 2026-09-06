import fs from 'fs';
// Append new day objects to the DAYS array and restamp ROTATION_ANCHOR.
//
// Appending (rather than interleaving) is deliberate: array position IS the day
// number, so inserting mid-array would renumber every later entry. Ben accepted
// that new days surface at the end of the rotation.
//
// Usage: node tools/qa/add-days.mjs <new-days.mjs> [--write] [--anchor DATE:NUM]
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const srcFile = args.find(a => !a.startsWith('--'));
const ai = args.indexOf('--anchor');
const anchorArg = ai === -1 ? '' : (args[ai + 1] || '');
if (ai !== -1 && !/^\d{4}-\d{2}-\d{2}:\d+$/.test(anchorArg)) {
  console.error('--anchor needs YYYY-MM-DD:DAYNUMBER'); process.exit(1);
}
const path = 'app/api/cron/bcba-brief/route.js';
if (!srcFile) { console.error('need a file of new days'); process.exit(1); }

const TCO = JSON.parse(fs.readFileSync('tools/qa/tco-6th-ed.json', 'utf8'));
const DOMAIN = {
  A: 'Behaviorism and Philosophical Foundations', B: 'Concepts and Principles',
  C: 'Measurement, Data Display, and Interpretation', D: 'Experimental Design',
  E: 'Ethical and Professional Issues', F: 'Behavior Assessment',
  G: 'Behavior-Change Procedures', H: 'Selecting and Implementing Interventions',
  I: 'Personnel Supervision and Management',
};

let src = fs.readFileSync(path, 'utf8');
const s = src.indexOf('const DAYS = ['), e = src.indexOf('\n];', s);
const existing = eval(src.slice(s + 'const DAYS = '.length, e + 3));
const raw = fs.readFileSync(srcFile, 'utf8');
const incoming = eval(raw.slice(raw.indexOf('[')));

// ---- validate before touching anything -------------------------------------
const errs = [];
const codes = new Set(existing.map(d => d.taskCode));
const wc = t => (t || '').trim().split(/\s+/).length;
incoming.forEach((d, i) => {
  const at = `new day #${i + 1} (${d.taskCode})`;
  const base = (d.taskCode.split('/')[0].trim().match(/^[A-I]\.\d+/) || [])[0];
  if (!base || !TCO[base]) errs.push(`${at}: unknown task code`);
  else {
    if (DOMAIN[base[0]] !== d.domain) errs.push(`${at}: domain "${d.domain}" != code letter ${base[0]}`);
    const want = d.taskCode.split('/').map(p => (p.trim().match(/^[A-I]\.\d+/) || [])[0]).filter(Boolean).map(c => TCO[c]).join(' ');
    if (d.taskDesc !== want) errs.push(`${at}: taskDesc not verbatim\n     is:   ${d.taskDesc}\n     want: ${want}`);
  }
  if (codes.has(d.taskCode)) errs.push(`${at}: taskCode already used`);
  codes.add(d.taskCode);
  if (!d.questions || d.questions.length !== 3) errs.push(`${at}: needs exactly 3 questions`);
  (d.questions || []).forEach((q, qi) => {
    if (q.options.length !== 4) errs.push(`${at} q${qi + 1}: needs 4 options`);
    q.options.forEach((o, oi) => { if (!o.startsWith('ABCD'[oi] + '. ')) errs.push(`${at} q${qi + 1}: option ${oi + 1} mislabelled`); });
    if (!'ABCD'.includes(q.answer)) errs.push(`${at} q${qi + 1}: bad answer letter`);
    if (wc(q.q) < 8 || wc(q.q) > 22) errs.push(`${at} q${qi + 1}: stem ${wc(q.q)}w (target 8-22)`);
    if (wc(q.rationale) < 24 || wc(q.rationale) > 38) errs.push(`${at} q${qi + 1}: rationale ${wc(q.rationale)}w (target 24-38)`);
  });
  if (new Set((d.questions || []).map(q => q.answer)).size === 1) errs.push(`${at}: all 3 answers same letter`);
  const bw = wc(d.concept.body);
  if (bw < 230 || bw > 290) errs.push(`${at}: concept.body ${bw}w (target 230-290)`);
  const paras = d.concept.body.split('\n\n').length;
  if (paras < 4 || paras > 5) errs.push(`${at}: concept.body ${paras} paragraphs (target 4-5)`);
  if (wc(d.concept.title) < 5 || wc(d.concept.title) > 9) errs.push(`${at}: title ${wc(d.concept.title)}w (target 5-9)`);
  const rw = wc(d.research.summary);
  if (rw < 110 || rw > 135) errs.push(`${at}: research.summary ${rw}w (target 110-135)`);
  const aw = wc(d.application);
  if (aw < 55 || aw > 80) errs.push(`${at}: application ${aw}w (target 55-80)`);
  if (src.includes(d.research.citation)) errs.push(`${at}: citation already used in the file`);
});

if (errs.length) { console.error(`REFUSING — ${errs.length} problem(s):\n` + errs.map(x => '  - ' + x).join('\n')); process.exit(1); }

// ---- serialise in the file's existing style --------------------------------
const q = t => JSON.stringify(t);
const render = (d, n) => `  {
    day: ${n}, domain: ${q(d.domain)}, taskCode: ${q(d.taskCode)},
    taskDesc: ${q(d.taskDesc)},
    concept: {
      title: ${q(d.concept.title)},
      body: ${q(d.concept.body)}
    },
    research: {
      citation: ${q(d.research.citation)},
      summary: ${q(d.research.summary)}
    },
    application: ${q(d.application)},
    questions: [
${d.questions.map(x => `      { q: ${q(x.q)}, options: [${x.options.map(q).join(', ')}], answer: ${q(x.answer)}, rationale: ${q(x.rationale)} }`).join(',\n')}
    ]
  }`;

const block = incoming.map((d, i) => render(d, existing.length + i + 1)).join(',\n');
// The array already ends with a trailing comma. Emitting another one produces
// an elision — a hole that evals to `undefined` and crashes the send. Only add
// a separator when the existing text does not already end in one.
const head = src.slice(0, e);
const sep = /,\s*$/.test(head) ? '\n' : ',\n';
src = head + sep + block + src.slice(e);

const newLen = existing.length + incoming.length;
if (anchorArg) {
  const [date, num] = anchorArg.split(':');
  src = src.replace(/const ROTATION_ANCHOR = \{[^}]*\};/,
    `const ROTATION_ANCHOR = { date: "${date}", dayNumber: ${num} };`);
  console.log(`ROTATION_ANCHOR restamped to ${date} / day ${num}`);
}
console.log(`validated ${incoming.length} new days; DAYS.length ${existing.length} -> ${newLen}`);
if (WRITE) { fs.writeFileSync(path, src); console.log('written'); }
else console.log('DRY RUN — pass --write to apply');
