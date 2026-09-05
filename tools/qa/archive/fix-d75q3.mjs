import fs from 'fs';
const path='app/api/cron/bcba-brief/route.js';
const OLD = "B. ‘Aggression: hitting, kicking, or biting others, recorded throughout instructional and play sessions’";
const NEW = "B. ‘Aggression: hitting, kicking, or biting others, or any other behavior of a similar aggressive character’";
let s = fs.readFileSync(path,'utf8');
// the file may use straight quotes; find the actual current option string
const m = s.match(/B\. .Aggression: hitting, kicking, or biting others, recorded throughout instructional and play sessions./);
if (!m) { console.log('current B not found — dumping candidates'); process.exit(1); }
const cur = m[0];
const repl = cur.replace('recorded throughout instructional and play sessions','or any other behavior of a similar aggressive character');
const strip=x=>x.replace(/^[A-D]\.\s*/,'');
console.log('OLD B ['+strip(cur).length+']:', cur);
console.log('NEW B ['+strip(repl).length+']:', repl);
if (s.split(cur).length !== 2) { console.log('not unique in file'); process.exit(1); }
fs.writeFileSync(path, s.replace(cur, repl));
console.log('applied');
