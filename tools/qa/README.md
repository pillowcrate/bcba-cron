# Question-bank QA harness

Scripts that measure and fix **tells** in the BCBA newsletter question bank — patterns
that let a test-taker pick the right answer without knowing the material.

These were written during the Sept 2026 pass that cut the longest-answer tell from
71% to 33%. They lived in `.bcba-build/` (gitignored) and were nearly lost; they are
tracked here now.

**Run everything from the repo root**, not from this directory:

```
node tools/qa/measure-len.mjs
```

They read `app/api/cron/bcba-brief/route.js` directly and scratch to `.bcba-build/`,
which stays gitignored. Nothing here is part of the deployed app — no build or runtime
depends on it.

## Read-only metrics — safe to run anytime

| Script | What it tells you |
|---|---|
| `measure-len.mjs` | The headline one. How often the correct answer is the longest option. Chance is 25%; **currently 33%**. Also prints answer-letter distribution (should be even) and the char-length gap distribution. |
| `measure-jargon.mjs` | How often the correct answer has the most long/technical words. Currently 17.9% against a 25% chance baseline — i.e. no tell. |
| `scan-grammar-tell.mjs` | Flags questions where the correct answer's **first word** breaks a pattern the three distractors share (all start "The", all are `-ing` gerunds, etc). Currently 9 flags. |
| `gap-dist.mjs` | Ranked list of how far the correct answer exceeds its nearest rival, in characters. |
| `sample-offenders.mjs` | Prints actual offending questions with per-option lengths, so you can eyeball them. |

## Fix pipeline — these write files

Run in order. Only needed when you're actually rewriting questions.

1. **`extract-targets.mjs`** — pulls every question out of `route.js` into
   `.bcba-build/all-questions.json`, selects those with a ≥15-char gap as rewrite
   targets, and splits them into batches. *Currently selects 0 targets — the bank is
   already below threshold.*
2. Rewrite the batches (see `archive/BRIEF-LENGTH.md` for the authoring instructions).
   Write results as `.bcba-build/rewrite-NN.json`.
3. **`archive/apply-length-fix.mjs`** — writes accepted rewrites back into `route.js`
   and records which question ids it touched in `.bcba-build/applied-ids.json`.

## Blind re-answer check — the important one

**Fixing a tell reliably creates a new one.** Equalizing option lengths tends to make
distractors accidentally *true*, and moves the tell from length into grammar. The only
thing that catches this is answering the questions cold, with no answer key.

1. **`make-blind.mjs`** — builds answer-key-free question sets from the questions you
   just changed, with options deterministically reshuffled so position carries no
   information. Requires `applied-ids.json` from the step above.
2. Answer them blind — no key, no rationale. See `archive/BRIEF-BLIND.md`. Save picks
   as `.bcba-build/answers-NN.json`.
3. **`score-blind.mjs`** — unshuffles and scores against the real key. Reports
   disagreements (a distractor may now be true) and questions with more than one
   defensible answer.
4. **`blind-round2.mjs`** / **`blind-recheck.mjs`** — re-check a narrow subset after
   further edits, with fresh shuffles. **The subset is hardcoded** (`blind-round2.mjs:6`,
   `blind-recheck.mjs:6`) to the specific questions being chased in Sept 2026. Edit that
   list before reusing them, or you will silently re-check the old eleven instead of
   your own.

Last run: 129/129 agreement with the key, 2 flagged as having a second defensible
answer (`d9q2`, `d75q3`). Those two, plus further edits, went through four more rounds:
`r2A`/`r2B` (11 questions each), `r3` (`d54q1`, `d84q2`), and `r4` (`d36q3`, the fix in
`72cb2ac`). Rounds 3 and 4 were generated ad hoc — **no script in this directory
reproduces them**, which is why their keys are committed.

## blind-run/ — the preserved record of that run

`blind-run/` holds the **authored** blind picks (`answers-*.json` — each with a
confidence rating and prose reasoning) plus `applied-ids.json`, and every blind question
set with its matching key. The picks are the one thing here that **no script can
regenerate**: they are human judgement, not derived data. `make-blind.mjs` also
hard-requires `applied-ids.json`.

The keys are not optional bookkeeping. A pick is recorded as a letter in *shuffled*
space, so `"pick": "D"` is meaningless without the key that maps it back — for `d36q3`,
blind D decodes to real option B. Every `answers-*.json` here has its key.

`blind-run/wave1/` is the same thing for the five days added in September 2026
(C.3, C.4, C.6, D.9, I.1) — 15 questions, 15/15 agreement, one item (`d113q1`)
caught with two defensible answers, fixed, and re-checked blind with a fresh
shuffle. It lives in a subdirectory because its `answers-*.json` files share
filenames with the original run's; copying them into the same directory would
silently overwrite the 129-question record.

To reproduce the 129/129 result from a clean checkout:

```
node tools/qa/extract-targets.mjs      # regenerates all-questions.json, creates .bcba-build/
cp tools/qa/blind-run/* .bcba-build/   # restores the authored answers and keys
node tools/qa/score-blind.mjs
```

Verified working from a `git archive` checkout on 2026-09-05.

**Read that as reproducing a historical result, not as re-verifying the bank.**
`score-blind.mjs` compares Sept-2026 human picks against whatever `route.js` says
*today*. 12 of the 129 questions have already been edited since those picks were made
(`d1q2`, `d9q2`, `d30q2`, `d36q3`, `d43q3`, `d47q3`, `d54q1`, `d75q3`, `d81q3`, `d84q2`,
`d102q2`, `d102q3`) and it still prints 129/129 with no warning, because the correct
*letter* did not move. Each of those was re-checked in a later round — that is what
`r2`–`r4` are — but the scorer cannot see that. To actually verify the bank, run a fresh
`make-blind` → answer → `score-blind` cycle.

## Gotchas

- **Re-running `make-blind.mjs` silently invalidates old answers — but not the way you'd
  expect.** The option shuffle is a pure function of the question id, so `blind-key.json`
  regenerates byte-identical and is *not* the hazard. The hazard is that `make-blind.mjs`
  reads the **current** `route.js`, so the question *text* changes whenever questions
  change. Old `answers-*.json` then refer to wording that no longer exists. Note the
  mechanism: `score-blind.mjs` never opens `blind-NN.json` at all — it scores against
  `all-questions.json`, which `extract-targets.mjs` regenerates from today's `route.js`.
  So it will score stale picks without warning. Score before
  regenerating, or work on a copy.
- **`score-blind.mjs` hardcodes its denominator** (`... / 129`) but computes the
  percentage from the answers it actually loaded. If answer files are missing it prints
  something like "64 / 129" followed by "100.0% agreement". Check both numbers.
- **`applied-ids.json` is per-run.** `make-blind.mjs` requires it.
  `scan-grammar-tell.mjs` uses it only to separate "questions I just changed" from
  pre-existing flags, and degrades gracefully when it's missing.
- **These parse `route.js` by string matching**, locating `const DAYS = [` and
  `eval`-ing the array. Restructuring that file will break them. `extract-targets.mjs`
  also matches question stems by line prefix and will throw loudly on a mismatch rather
  than produce bad data.
- `gap-dist.mjs` prints `+undefined chars (~NaN)` for rank thresholds beyond the number
  of offenders. Cosmetic, pre-existing.

## archive/

One-shot scripts already applied to `route.js`, kept as a **record of what was changed,
not a runnable pipeline**. The `fix-*.mjs` targeted repairs re-run safely (they check for
a unique match and exit non-zero otherwise), but `merge.js` and `polish*.js` cannot run at
all — they need `order.json`, `remap.json` and `out_g*.js`, which were not kept.

Also here: the authoring and review briefs (`BRIEF*.md`), `ASSIGNMENTS.md`, and
`STATUS.md`. **These are point-in-time documents and some are already stale** — e.g.
`STATUS.md` lists `START_DATE` as a required production env var, which was retired in
`bc32ade`. Read them as history, not as current instructions.

Not preserved, for two different reasons — the distinction matters, because assuming the
wrong one is what nearly lost the blind answers:

- **Regenerate from `extract-targets.mjs`** against the current `route.js`:
  `all-questions.json`, `targets.json`, `batch-*.json`. Those are the only three files
  it writes.
- **Recoverable from `route.js` in git history, not from any script:** the `route.*.js`
  snapshots (~620KB each) and the 17 `out_g*.js` authoring outputs. Their content was
  merged into `route.js`, which is tracked. Nothing regenerates them.

`.bcba-build/` itself was never tracked in git, so anything left there and not in one of
those two categories is simply gone if the directory is cleaned. That is exactly why the
authored picks and keys in `blind-run/` are committed rather than left behind.
