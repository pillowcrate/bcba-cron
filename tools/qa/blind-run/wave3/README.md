# Wave 3 blind run — days 123-128 (September 2026)

Six domain-F (Behavior Assessment) days added to the deck (122 -> 128). This directory
holds the **authored** blind picks, which no script regenerates, plus the question sets
and the key mapping shuffled letters back to real ones.

A pick is a letter in *shuffled* space. `"pick": "D"` is meaningless without
`blind-key.json`. That key is an array per question id: index 0-3 = shuffled A-D,
value = the real option letter. Score with `node tools/qa/blind-run/wave3/score-wave3.mjs`
(expects `blind-key.json` and `applied-ids.json` copied into `.bcba-build/`).

## Result

**18/18 agreement with the answer key**, six independent agents, one per batch, none with
the key or access to `route.js`. Answer-letter distribution across the whole 384-question
deck landed exactly even at 96/96/96/96.

Two items were flagged as having a second defensible answer:

| item | flaw | resolution |
|---|---|---|
| `d125q1` | distractor "Report the behavior as multiply controlled by both functions" was genuinely defensible — divergent outcomes across FA formats *can* reflect multiply controlled responding | distractor replaced with "Repeat the trial-based analysis until results agree" (plainly indefensible: that is confirmation bias, not replication) |
| `d125q3` | **not changed — see below** | kept deliberately |

`d125q1` was then re-checked blind under a **fresh shuffle** by two more independent
agents (`answers-recheck-d125q1.json`). Both picked the key, both listed it as the *only*
defensible option, and both explicitly argued the new distractor down. One noted the keyed
option bundles "examine the discrepancy" with "trust the standard analysis" and teaches a
slightly more categorical rule than the evidence strictly supports. That is a fair style
critique but not a defect — it does not make any distractor true, and Bloom et al. did
exactly this, resolving noncorrespondence by modifying trials and verifying against the
standard analysis. Left alone deliberately: in Wave 2 the round-4 repairs introduced two
fresh regressions, so a non-defect is not worth another edit cycle.

## Why `d125q3` was kept despite a low-confidence split

`d125q3` asks what Bloom et al. (2011) found about trial-based FA duration. The blind agent
split between "slightly more total assessment time" (the key) and "substantially less", at
low confidence, and observed that the item tests recall of one number rather than concept.

It was kept, for three reasons:

1. **The claim was independently re-verified against the paper**, because it is
   counterintuitive and the whole item rests on it. Verbatim: *"Not counting time spent
   waiting for appropriate opportunities to conduct trials, the mean total durations of the
   trial-based and standard functional analyses were 4 hr 31 min and 3 hr 53 min,
   respectively."* And: *"Overall efficiency, however, does not appear to be an advantage of
   the trial-based procedure."*
2. **The "second defensible answer" is the misconception the item exists to correct.** A
   practitioner reasoning from general lore assumes trial-based is faster. It is not. That is
   the teaching point, and `concept.body` states it plainly.
3. Blind agents answer *without* the day's content. Every citation-recall item in this deck
   (e.g. `d109q3`, `d114q3`) looks unfair under blind conditions. The item is answerable by
   anyone who read the day.

**Generalisable lesson: a blind flag is evidence, not a verdict.** Distinguish "a distractor
is accidentally true" (always fix) from "the key requires having read the day" (fine, that is
what the day is for).

## Question text drifted AFTER these picks were recorded

Per the harness gotcha in `tools/qa/README.md`: the picks here were made against the question text
as it stood at blind time, and eight claims were tightened afterwards by the fact-checking pass.
One of those touched a **question stem**:

- `d127q2` was *"An item ranked last in an **MSWO**…"* when it was answered blind. It now reads
  *"An item ranked last in a **paired-stimulus** preference assessment…"*, because Roscoe, Iwata &
  Kahng (1999) used single- and paired-stimulus methods and never used MSWO.

The blind result still stands: the answering agent's reasoning was *"MSWO yields a relative
preference hierarchy, not an absolute test of reinforcer function; a last-ranked item was simply
beaten by the others when they were concurrently available"* — which applies identically to a
paired-stimulus assessment. The key did not move and no option text changed. Recorded here anyway,
because a future reader comparing `answers-all.json` against `route.js` will otherwise find a stem
that does not match, and the whole point of this directory is that stale picks are scored silently.

Everything else the fact-checker changed was in `concept.body`, `research.summary` or a `rationale`
— none of it in an option. The full list is in `SOURCES.md`.

## The thing this harness still cannot catch

Blind checking scores each item in isolation and is structurally incapable of finding
contradictions *between* days. A separate whole-deck consistency pass was run by the
`reviewer` agent. See `CONSISTENCY.md` in this directory for what it found.

One cross-day conflict was caught **before** authoring rather than after, by scanning the
deck for candidate topics first: **day 114 (C.4) already teaches latency-based functional
analysis** and already uses Thomason-Sassi et al. (2011) as its citation. Day 125 was
therefore scoped to brief + trial-based FA only. Had that scan not happened, Wave 3 would
have shipped a duplicate day and a reused citation.

## Citation accuracy

All six citations were verified against Crossref (authors, year, journal, volume, issue,
pages) **before** authoring. Findings were taken from fetched full texts where they exist.

**Abstract-only by design — do not "improve" these with specifics:**
`O'Reilly (1997)`, `Vollmer et al. (2001)` and `Jessel et al. (2016)` have no accessible
full text (scanned page images with no text layer, or not deposited in PMC). Their
`research.summary` fields contain no participant-level detail beyond what the abstract
states. This is the same constraint as Richman et al. (1988) in Wave 2.

O'Reilly's hedge is the author's own — *"may have served as an establishing operation"* —
and is preserved verbatim. It is not weasel wording; do not sharpen it.

Full provenance, including which papers full text was obtained for and by what route, is in
`SOURCES.md` in this directory.

## Files

- `blind-01..06.json` — question sets, options shuffled, no key
- `blind-key.json` — maps shuffled letters back to real option letters
- `answers-all.json` — the 18 authored picks with confidence and defensible sets
- `answers-recheck-d125q1.json` — the two fresh-shuffle rechecks after the repair
- `applied-ids.json` — the 18 ids, required by `make-blind.mjs`
- `score-wave3.mjs` — scorer for this run (the shared `score-blind.mjs` hardcodes /129)
- `SOURCES.md` — citation verification and full-text availability record
- `CONSISTENCY.md` — the cross-day consistency pass

Batches are grouped by question slot, so `blind-01.json` holds q1s.
