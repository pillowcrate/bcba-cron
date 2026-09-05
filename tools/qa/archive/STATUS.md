# BCBA newsletter expansion — COMPLETE (except deploy)

## Result
`app/api/cron/bcba-brief/route.js` now holds **112 days** (was 63). 49 new 6th-edition days were
written, all 63 legacy task codes were remapped to the BCBA 6th-edition TCO, and the whole array
was shuffled once so old and new interleave.

## Verified (not asserted)
- 112 entries; `day:` 1..112 contiguous, matches array position
- 112 distinct taskCodes; 0 domain/code mismatches; only the 9 real 6th-ed domains in use
- All 336 questions: 4 options each labelled "A. ".."D. ", every `answer` maps to a real option
- All 112 emails render: balanced HTML, no `undefined`, no empty paragraphs
- `next build` compiles (needs RESEND_API_KEY present; it is not in .env.local, only on Vercel)
- Everything outside the DAYS array byte-identical to HEAD: cron schedule, recipients,
  from-address, buildEmail, getTodayIndex, countWeekdays
- All 23 non-canonical citations verified against Crossref + PubMed/PMC — zero discrepancies
- All 6 calculation questions checked by hand
- Length match to the live corpus — medians old→new: body 241→268, summary 123→127,
  application 68→67, rationale 31→32, title 7→7

## TCO coverage
102 of 104 items explicitly labelled. Not labelled: **C.3** (measure occurrence — content sits
inside day 13) and **D.9** (apply single-case designs — done in substance by the four D.7 days).

## Follow-up round (day counter, header wording, answer-key bias)
- `getTodayIndex` now uses `ROTATION_ANCHOR = {date:"2026-09-03", dayNumber:15}` instead of
  `START_DATE % DAYS.length`, so the counter continues 15,16,17,… instead of jumping to 79.
  The anchor was derived from START_DATE=2026-05-19, which is documented in `.env.example`
  and README.md line 55 — an earlier guess of 2026-05-16 (a Saturday) was wrong and would
  have skipped a day. START_DATE is now unused by the code; the Vercel var can be deleted.
  The anchor does NOT self-maintain: if DAYS.length changes again, restamp it.
- Header is now two lines: "BCBA Daily Brief · Day N of M" then
  "Test Content Outline (6th ed.) · {domain} · {taskCode}". All 112 `domain` values renamed
  to the nine official 6th-edition TCO domain names.
- Answer keys rebalanced on the 63 original days only: global A84/B84/C84/D84 AND
  28/28/28/28 within each of the three question slots. 0 all-same-letter days.
  Verified against `git show HEAD`: 189/189 old questions matched by stem, zero drift in
  option text or in WHICH option is correct — presentation permuted only.

## NOT FIXED — reported to the user, spawned as a task
**Longest-option tell: the correct answer is the uniquely longest option in 240/336 (71%)**
(old 63: 77%, new 49: 65%; chance ~25%). A reader can score ~71% without reading the stem.
Requires rewriting distractors, not reordering. This is the larger half of the "answer key
bias" problem and remains open.

## DEPLOY: BLOCKED, NOT DONE
`vercel --prod --yes` was blocked by the Claude Code permission classifier (a harness safety
check, unrelated to the code). Production env vars were confirmed present via `vercel env ls
production`: START_DATE, CRON_SECRET, RESEND_API_KEY.
To ship, run from the repo root:
    vercel --prod
The working tree is verified and build-clean; nothing else is needed before deploying.

## Known, reported to the user, NOT fixed
1. **`taskDesc` still carries 5th-edition wording on the 63 old entries.** Codes were remapped;
   descriptions were not. Never rendered in the email, so invisible to recipients, but the data
   is half-5th-edition. Median similarity to official TCO text: old 0.39 vs new 0.99.
2. **Answer-key bias in the original 63 days**: 51% of correct answers are "B"; 8 days have all
   three answers as B. New 49 are balanced (A27/B27/C23/D24). Spawned as a separate task.
3. **Day counter jumps** from "Day 15 of 63" to "Day 78 of 112" on the next send — correct
   arithmetic (77 elapsed weekdays; 77%63=14, 77%112=77), but looks like a malfunction.
4. **Three 5th-edition topics have no 6th-edition home**: self-management (day 20), mand training
   (day 36), contingency contracting (day 77). Filed under G.16 / G.5 / G.10 as reasoned
   stretches, not exact matches.
5. **Content overlaps**: day 68 (momentum + matching law overview) vs days 39/71 which each go
   deep on one; day 104 vs day 112 both cover scope of competence.

## Files here
BRIEF.md · ASSIGNMENTS.md · remap.json · merge.js · out_g01..g17.js · order.json ·
route.preview.js. This whole directory is gitignored and can be deleted once you are happy.
