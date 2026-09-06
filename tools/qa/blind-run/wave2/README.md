# Wave 2 blind run — days 118-122 (September 2026)

Five domain-I days added to the deck (117 -> 122). This directory holds the
**authored** blind picks, which no script can regenerate, plus the question sets
and the key that maps shuffled letters back to real ones.

A pick is recorded as a letter in *shuffled* space. `"pick": "B"` is meaningless
without `blind-key.json`, which maps it back — the shuffle is a pure function of
question id, so the key regenerates, but keep it anyway.

## Result

**15/15 agreement with the answer key** across six batches, answered by six
independent agents with no key and no access to `route.js`.

Two items were flagged as having a second defensible answer and were fixed:

| item | flaw | fix |
|---|---|---|
| `d121q1` | distractor "increasing the frequency of scheduled observation" was defensibly correct — more observation genuinely does raise performance via reactivity | distractor replaced |
| `d121q2` | answerable from the citation title alone; only one option named an effort manipulation at all. Also inaccurate: hand sanitizing varied dispenser pressure, not distance | all four options rewritten as plausible effort manipulations; key names both mechanisms |

`d121q1` then needed two further rounds. See `answers-recheck-d121.json`
(rounds 2-3) and `answers-recheck-d121q1-round4.json` (round 4).

## The thing the blind harness cannot catch

Round 4 exists because the `reviewer` agent found a **cross-day contradiction**
that blind checking is structurally incapable of finding: day 58 q1 and the
original day 121 q1 posed the same can-do/won't-do scenario and keyed **opposite**
analyses — day 58 to a consequence contingency, day 121 to an antecedent.

Blind checking scores each question in isolation. It will happily pass two
questions that contradict each other, because each is internally sound. **Run a
whole-deck consistency pass separately; do not assume 15/15 means coherent.**

## Citation accuracy

All five citations were verified against Crossref before authoring (authors,
year, journal, volume, issue, pages), and the *findings* were taken from fetched
abstracts and PMC full texts rather than recollection.

One constraint worth preserving: **Richman et al. (1988) full text is
unavailable** — the PMC record is scanned page images with no text layer, and the
XML and PDF endpoints are blocked. Its `research.summary` is therefore written
from the abstract only and contains no participant counts, no numbers and no
design details. A reviewer suspected the evening-generalization claim was
fabricated; it is not — the abstract states it verbatim. Do not "improve" that
summary with specifics unless someone obtains the actual paper.

Similarly, a reviewer challenged the Casella universal claim ("for every
dependent variable and every participant") as overreach. It is the authors' own
wording: *"increased safe performance during the low-effort conditions relative
to other conditions across all dependent variables for all participants."*

## Files

- `blind-01..06.json` — question sets, options shuffled, no key
- `blind-key.json` — maps shuffled letters back to real option letters
- `answers-01..06.json` — the authored picks with confidence, defensible set, reasoning
- `answers-recheck-d121.json` — rounds 2 and 3 on the two flagged items
- `answers-recheck-d121q1-round4.json` — round 4, the cross-day contradiction fix
- `applied-ids.json` — the 15 ids, required by `make-blind.mjs`

Batches are grouped by question slot, so `blind-01.json` holds the q1s.
