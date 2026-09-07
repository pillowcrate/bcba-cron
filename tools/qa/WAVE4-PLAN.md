# Wave 4 plan

Written 2026-09-07, after Wave 3 shipped and the deck-wide contradiction sweep landed
(`fba1591`). Deck is **128 days, 384 questions, 104/104 TCO coverage**.

**Ben runs one wave at a time and wants to be asked before each one starts.** He responds well to
a short slate with per-topic evidence of zero prior coverage; in Wave 3 he took all six proposed
topics without swapping any.

---

## Scope: 8 parity days + 2 content gaps = 10 days, deck 128 → 138

### Part A — the two content gaps (Ben asked for these explicitly)

Both were found by the deck-wide sweep. Neither is a contradiction; both are **absences** in
commonly tested areas, which is why they were flagged rather than silently fixed.

**A1. DRO interval mechanics — `G.2 · DRO Variants`**

Confirmed gap: no day anywhere in the deck mentions **resetting** vs **non-resetting (interval)**
vs **momentary** DRO. Day 25 (`G.2 · DRA/DRI/DRO`) is the only day defining DRO mechanics at all,
and gives one sentence: *"reinforcement at the end of an interval during which the problem behavior
did not occur."* Day 62 (`D.8`) uses DRO only as a parametric-analysis example.

What the day must cover, because it is what gets tested:
- Whole-interval (resetting) DRO — an occurrence **resets** the interval timer.
- Non-resetting interval DRO — the interval runs to its scheduled end regardless.
- Momentary DRO — behavior must be absent only at the moment the interval ends; easier to run,
  weaker control, and the variant most often mis-scored on the exam.
- How to set the initial interval from baseline IRT, and how to thin it.
- The trap: DRO reinforces the *absence* of behavior, so it can inadvertently reinforce any other
  behavior occurring at interval's end, including a second problem behavior.

Existing `G.2` taskCodes in use — must not collide: `G.2 · DRA/DRI/DRO` (25), `G.2 · DRL` (43),
`G.2 · FCT` (82). `taskDesc` for base `G.2` is verbatim: *"Design and evaluate differential
reinforcement (e.g., DRA, DRO, DRL, DRH) procedures with and without extinction."*

**Check before authoring:** day 25 must not end up contradicting the new day. If day 25's single
DRO sentence describes only one variant, either scope it explicitly to resetting DRO or leave it
and have the new day name it as the default case.

**A2. Assent — `E.1 · Consent and Assent`**

Confirmed gap with a nuance: the word "assent" **does** appear once, on day 35 (`G.18`), but only
as *"assent withdrawal … is an observable dependent variable"* in a discussion of extinction side
effects. The **obligation** is absent. Code 2.11 ends: *"They are responsible for obtaining assent
from clients when applicable."* No question in the 384-item bank tests it.

What the day must cover:
- Consent (from the legally authorised party) vs assent (from the client), and why both.
- When assent is "applicable" — minors, adults with guardians, anyone who cannot give legal consent.
- Assent **withdrawal** as observable behavior, which is the bridge to day 35's existing treatment
  and the thing that makes this behavior-analytic rather than a paperwork topic.
- Ongoing rather than one-time; the obligation to re-obtain when the plan materially changes.

Existing `E.1` day: 57 (*The BACB Ethics Code: Core Principles and the Least Restrictive
Alternative*), which covers informed consent. New day needs a middle-dot qualifier since `taskCode`
must be unique. **Check day 57 for overlap before authoring** — it already touches consent, so the
new day should own assent specifically and defer to 57 on consent, the way day 123 was made to
defer to day 37 on medical referral.

### Part B — the parity gap: C / E / H (+8)

Current per-domain counts against exam weighting; C, E and H are the remaining under-weighted
domains:

| Domain | Days |
|---|---|
| Concepts and Principles (B) | 23 |
| Behavior-Change Procedures (G) | 26 |
| Behavior Assessment (F) | 15 |
| Personnel Supervision (I) | 13 |
| Ethical and Professional Issues (E) | 12 |
| Experimental Design (D) | 12 |
| Measurement, Data Display (C) | 11 |
| Selecting and Implementing (H) | 11 |
| Behaviorism and Philosophical Foundations (A) | 5 |

A2 above counts toward E. Pick the remaining seven across C, E and H by the Wave 3 method: scan the
whole deck for candidate topics **before** authoring and require evidence of zero prior coverage.

---

## Process — follow Wave 3's, it worked

1. **Scan the existing deck for candidate topics BEFORE authoring.** This is the cheapest possible
   fix and it caught a duplicate in Wave 3 (day 114 already taught latency-based FA *and* already
   used the citation planned for the new day). `add-days.mjs` catches a reused citation but never a
   duplicated topic.
2. **Verify every citation against Crossref before writing** (authors, year, journal, volume, issue,
   pages), then take findings from fetched abstracts or full texts, never recollection. Record which
   papers are abstract-only and write those summaries without specifics.
3. Author into a file; validate with `node tools/qa/add-days.mjs <file>` (dry-run by default,
   refuses on any failure).
4. **Do NOT restamp `ROTATION_ANCHOR`** unless it is genuinely stale. See rule 3 in the skill.
5. Blind re-answer pass with agents holding no key; require an explicit "list EVERY defensible
   option" field. Write new ids to `.bcba-build/applied-ids.json` **before** running
   `scan-grammar-tell.mjs` or new flags get misfiled as pre-existing.
6. **Whole-deck consistency pass** — blind checking is structurally incapable of catching cross-day
   contradictions. See `blind-run/wave3/CONSISTENCY.md`.
7. Keep answer letters near-uniform (currently exactly 96/96/96/96) and do not raise the
   longest-answer tell (currently 32.3%).

## Known state going in

- **43 of 128 days are outside the field-length targets.** All pre-existing: the legacy days predate
  `add-days.mjs`, which validates only new entries. Not a bug to fix in a content wave.
- Days 113–128 were appended in single-domain blocks, so the rotation currently ends in six
  consecutive Personnel Supervision sends followed by six consecutive Behavior Assessment sends.
  Accepted twice by Ben. Appending is what `add-days.mjs` does by design.
- Nothing in the deck states the **three-demonstrations-of-effect** convention as a positive claim;
  day 107 was amended in the sweep to say it. Worth a look if a C or D day touches design logic.
