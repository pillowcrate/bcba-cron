# Wave 3 cross-day consistency pass

The blind harness scores each question in isolation and is **structurally incapable** of finding
contradictions between days. This pass is the separate check that catches those. It was run by the
`reviewer` agent against the full 128-day deck, plus a lexical near-duplicate scan of all 18 new
questions against all 366 existing ones.

## Caught BEFORE authoring (cheapest possible fix)

**Day 114 (C.4) already teaches latency-based functional analysis** and already uses Thomason-Sassi
et al. (2011) as its `research.citation`. The Wave 3 topic slate originally had "brief, trial-based
and latency-based FA" as one day. Scanning the deck for candidate topics *before* writing caught it,
and day 125 was rescoped to brief + trial-based only.

Without that scan Wave 3 would have shipped a duplicate topic and a reused citation — and
`add-days.mjs` would have caught only the citation, not the duplication.

**Lesson: run the topic scan against the existing deck before authoring, not after.**

## Found by the review, and fixed

**1. `d123q1` vs `d37q1` — same scenario shape, divergent rule.** This is the same failure mode as
Wave 2's day-121/day-58 collision.

- `d37q1`: sudden screaming and food refusal, no programming change → key *"Recommend medical
  evaluation before further assessment."*
- `d123q1`: self-injury coincides with recurrent ear infections → key *"Sample both symptomatic and
  symptom-free periods."*

No key-versus-key conflict, because `d123q1` offers no "refer for medical evaluation" option. But a
learner reading both days extracted two rules for one situation, and day 123 bracketed the referral
question out rather than resolving it.

**Fixed** in day 123's `concept.body`: *"Deciding whether services are warranted, and referring a
plausible medical cause for evaluation before any analysis, is a separate obligation that still
runs first."* Day 123 now defers to day 37 explicitly instead of silently competing with it.

**2. Day 128's `application` recommended what `d104q1` keys as wrong.**

`d104q1` asks what to do before designing a reduction program for automatically maintained SIB;
the key is *"Consult medical professionals to rule out pain or other medical causes"* and one of its
distractors is conducting a preference assessment to find competing stimuli. Day 128's application
told the reader to run reinforcement-based intervention and a competing stimulus assessment "first",
with no mention of medical rule-out.

**Fixed**: the application now opens *"With medical causes ruled out and automatic maintenance
established, …"*

**3. Day 128's caveat was a stipulation with no mechanism.** It required automatic maintenance to be
"already established" before subtyping — but Subtype 2 is *defined* by an undifferentiated FA, and
nothing in the deck said how automatic maintenance gets established when analog conditions do not
differentiate.

**Fixed**: the caveat now names the mechanism — *"typically an extended series of alone sessions,
which is how automatic maintenance gets established when analog conditions do not differentiate."*

## Found, judged sound, no change

**Day 128 vs day 109 — checked specifically, and the defusing holds.** Day 109 teaches that an
undifferentiated FA should lead to modifying and repeating the analysis, not to defaulting to
automatic reinforcement. Day 128's opening caveat restates that rule in substance, `d128q1` keys the
ordering explicitly, and `d128q2`'s stem presupposes "Subtype 2 automatically reinforced self-injury"
so it is a recall item about the model rather than an inference from undifferentiated data.

**"Contingency" carries two strengths across days 1 and 124.** Day 1 reserves the word for what only
an FA establishes; day 124 applies "contingency value" to a descriptive statistic. There is no keyed
conflict — day 124 hedges in prose (*"identifies possible contingencies only"*) and `d124q2`'s key
says "worth testing". Noted rather than changed.

**No redundancy found.** Each new day was checked against its nearest existing neighbour. Notably
`d56q2` (top-ranked item → candidate reinforcer) and `d127q2` (bottom-ranked → not established as a
non-reinforcer) run in opposite directions and are complementary, not duplicative.

## PRE-EXISTING contradiction — flagged, deliberately NOT fixed in this wave

**`d76q1` and `d109q2` describe the same data pattern and key opposite conclusions.**

- `d76q1`: *"vocal stereotypy occurs at comparable steady rates in the alone condition and every
  other condition"* → key **"Maintenance by automatic reinforcement."**
- `d109q2`: *"An undifferentiated functional analysis outcome (similar responding across all
  conditions, including control)"* → key **"Modify the analysis and repeat it before drawing
  conclusions"**, with a rationale that explicitly warns against the automatic-reinforcement default.

**Both days predate Wave 3. The new days did not create this.** What Wave 3 does is take day 109's
side in prose, so `d76q1`'s key is now contradicted by two other days rather than one.

It was left alone because Wave 3 is additive by design — its diff touches no existing entry — and
changing a keyed answer on an existing day is a different decision with a different risk profile.
The reviewer's suggested minimal repair, if it is ever taken up: change `d76q1`'s stem from
"in the alone condition and every other condition" to persistence **across repeated alone sessions**,
which preserves day 76's actual teaching point (no mediator present ⇒ not socially maintained) while
removing the overlap with the undifferentiated-outcome pattern. Do not weaken day 109.

## Scope of this pass — what was and was not checked

The reviewer read days 1, 4, 15, 19, 33, 37, 45, 56, 76, 80, 95, 104, 109, 113 and 114 in full, and
searched the remaining existing days by keyword cluster (automatic/undifferentiated,
preference/MSWO/reinforcer, descriptive/ABC/contingency, records/medical/pain,
precursor/trial-based/synthesized, latency/dangerous). It did **not** read all 122 existing
`concept.body` fields word for word. A contradiction living in prose in an unread day, on a topic
outside those clusters, would not have been found.
