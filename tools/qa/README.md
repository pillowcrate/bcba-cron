# Question-bank QA harness

Scripts that measure and fix **tells** in the BCBA newsletter question bank — patterns
that let a test-taker pick the right answer without knowing the material.

These were written during the Sept 2025 pass that cut the longest-answer tell from
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
   further edits, with fresh shuffles.

Last run: 129/129 agreement with the key, 2 flagged as having a second defensible
answer (`d9q2`, `d75q3`).

## Gotchas

- **The write scripts clobber.** Re-running `make-blind.mjs` regenerates
  `blind-key.json`, which silently invalidates the option mapping for any existing
  `answers-*.json`. Score first, or work on a copy.
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

One-shot scripts already applied to `route.js`, kept as the record of what was changed:
the `fix-*.mjs` targeted repairs, `apply-length-fix.mjs`, and `merge.js` / `polish*.js`
from the original authoring run. Also the authoring and review briefs (`BRIEF*.md`),
`ASSIGNMENTS.md`, and `STATUS.md`.

Not preserved: the bulk derived artifacts (`route.*.js` snapshots, `out_g*.js`, batch
and answer JSON). Those regenerate from `extract-targets.mjs` or exist in git history.
