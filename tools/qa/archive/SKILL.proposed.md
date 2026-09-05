---
name: add-newsletter-day
description: Use when adding a new day of BCBA exam-prep content to the bcba-cron newsletter (app/api/cron/bcba-brief/route.js). Triggers on "add a new day", "write day N", "add content for [domain]", or requests to extend the DAYS array.
---

# Add a BCBA Newsletter Day

This project emails one day of BCBA exam-prep content per weekday (cron: `0 12 * * 1-5`). All content lives in a single `DAYS` array in `app/api/cron/bcba-brief/route.js`, currently 112 entries. Every entry must match the existing shape, voice, and **length** exactly — this is graduate-level, citation-dense exam prep, not a casual blog post.

The deck is aligned to the **BACB BCBA Test Content Outline (6th ed.)** — 104 tasks across 9 domains. It is not the 5th-edition Task List; do not use `C-01`-style hyphen codes.

## Object shape (copy exactly)

```js
{
  day: number,                    // MUST equal this entry's 1-based position in the array
  domain: "string",               // exactly one of the nine 6th-ed domain names below
  taskCode: "string",             // 6th-ed TCO code, e.g. "B.17". See "Task codes" below.
  taskDesc: "string",             // the verbatim 6th-ed TCO task text for that code
  concept: {
    title: "string",              // specific, technical — not a restatement of taskDesc
    body: "string"                // 4 paragraphs (5 max), separated by \n\n — see Voice below
  },
  research: {
    citation: "string",           // full citation, see Citation format below
    summary: "string"             // 1 paragraph
  },
  application: "string",          // 1 paragraph, second person, to a BCBA supervising RBTs
  questions: [                    // exactly 3 questions
    { q: "string", options: ["A. ...", "B. ...", "C. ...", "D. ..."], answer: "A"|"B"|"C"|"D", rationale: "string" }
  ]
}
```

`\n\n` inside `body` is the two-character escape, never a real newline. All strings double-quoted; escape internal quotes as `\"`.

## Domains — use these strings exactly

`Behaviorism and Philosophical Foundations` (A) · `Concepts and Principles` (B) · `Measurement, Data Display, and Interpretation` (C) · `Experimental Design` (D) · `Ethical and Professional Issues` (E) · `Behavior Assessment` (F) · `Behavior-Change Procedures` (G) · `Selecting and Implementing Interventions` (H) · `Personnel Supervision and Management` (I)

**The leading letter of `taskCode` must match the domain.** The email header renders `{domain} · {taskCode}` together, so a mismatch teaches a wrong domain-code pairing. Verify before finishing.

## Task codes

- A single item: `"B.17"`.
- A day that genuinely trains two items: `"C.10/C.11"`.
- A day sharing a base code with an existing day: add a middle-dot qualifier, e.g. `"G.16 · Maintenance"` vs `"G.16 · Self-Management"`. `taskCode` must be unique across all entries.
- Two TCO items are covered in substance but not separately labelled: **C.3** (measure occurrence, inside the C.4/C.9 day) and **D.9** (apply single-case designs, across the four D.7 days). Either is a reasonable target for a new day.

## Where to insert — READ THIS BEFORE EDITING

The array is **not** chronological. The original 63 days and the 49 added 6th-edition days were shuffled together once, with a fixed seed, so the rotation mixes old and new content. Array position IS the day number printed in the email.

Consequences for adding a day:

1. **Insert at a position that keeps the mix**, not at the end. Appending buries new content roughly six months out in a 112-day rotation.
2. **Renumber every `day` field after the insertion point** so `day` still equals 1-based array position. This is the opposite of the old rule — do not preserve existing `day` values.
3. **Restamp `ROTATION_ANCHOR`** in the same file. The delivery index is `(ROTATION_ANCHOR.dayNumber - 1 + countWeekdays(ROTATION_ANCHOR.date, today)) % DAYS.length`. Changing `DAYS.length` without restamping makes the printed counter jump. Set `date` to the most recent send date and `dayNumber` to the number that send actually showed — read it from the subject line of the last email rather than calculating it.
4. Avoid placing the new day adjacent to another day in the same domain.

`.bcba-build/` (gitignored, may not exist) holds `merge.js`, which does insertion, renumbering, validation and coverage reporting mechanically. Prefer it over hand-editing.

## Length targets — measured, not approximate

The most common failure on this file is writing too long. An earlier batch came in at 2.4x and had to be redone.

| field | target (words) |
|---|---|
| `concept.title` | 5–9 |
| `concept.body` | 230–290, in 4 paragraphs |
| `research.summary` | 110–135 |
| `application` | 55–80 |
| question stem | 8–22 |
| each option | 3–11 |
| `rationale` | 24–38 |

Across the live corpus `concept.body` has a median of 241 words and a max of 323. Count words programmatically before writing and verify after. Do not calibrate by reading Day 1 — it is the longest entry in the file.

## Voice and content rules

- **concept.body**: 4 paragraphs. Open by framing why the concept matters clinically or on the exam — not a dictionary definition. Name at least one researcher inline with a year, e.g. "Michael (1993) distinguished...". Break the concept into 3–4 **named** sub-types or contrasts (see Day 1's frequency/duration/latency/IRT breakdown, or the DRL day's full-session / interval / spaced-responding breakdown); roughly a third of entries use a labelled lead-in (`Latency: Latency is the elapsed time...`), an efficient way to hit the word budget. End with the specific point the exam most commonly gets wrong or conflates. No second person here — that belongs only in `application`.
- **research.citation**: full academic citation.
  - Journal article: `Author, A. A., & Author, B. B. (Year). Title of article. Journal Name, Volume(Issue), pages.`
  - Book: `Author, A. A. (Year). Title of book (edition if applicable). Publisher.`
  - Book chapter: `Author, A. A. (Year). Chapter title. In B. B. Editor (Ed.), Book title (pp. x–y). Publisher.`
  - Use real, verifiable citations only. **Never fabricate.** If not certain of the author list, year, journal, volume, issue and pages, either verify against a primary source (Crossref, PubMed, PMC, publisher page) before using it, or fall back to a foundational source you are sure of — Cooper/Heron/Heward (2020), Baer/Wolf/Risley (1968), Skinner, Sidman, Johnston & Pennypacker, or a BACB document.
  - Michael's 1982 paper on discriminative vs motivational functions is *JEAB* 37(1), 149–155 — **not** JABA. Commonly misremembered.
  - Check the citation isn't already used elsewhere in the file. Foundational texts recur legitimately; a specific mid-tier article appearing three times does not.
- **research.summary**: what the cited work actually found or argued and why it is the reason the field does things this way — not a restatement of concept.body.
- **application**: practical, second-person, addressed to a supervising BCBA — something they could do this week with their caseload or their RBTs.
- **questions**: exactly 3, scenario-based rather than definition recall where possible. Each `rationale` explains why the correct answer is right AND briefly why the most tempting distractor is wrong. Include a calculation question where the domain supports one (IOA, rate, trials to criterion, procedural integrity, matching-law proportions), and show the arithmetic in the rationale.
- Tone throughout: technical, precise, zero filler, zero motivational-poster language. No emoji.

## Answer-key hygiene

The deck is deliberately balanced: correct answers are exactly 84/84/84/84 across A–D, and 28/28/28/28 within each of the three question slots. Adding a day nudges this — pick answer letters that keep it near-uniform, and never give one day the same letter three times.

**Known open issue:** the correct option is the uniquely longest of the four in about 71% of questions (chance is 25%), which lets a reader score well without reading the stem. Do not make it worse — write distractors comparable in length to the key.

Never write a rationale that names an option by letter ("Option C is correct"). Option order gets permuted during rebalancing and the reference goes stale.

## Before finishing

- `day` equals 1-based array position for **every** entry, contiguous from 1.
- `taskCode` unique; its leading letter matches `domain`.
- `ROTATION_ANCHOR` restamped if `DAYS.length` changed.
- Every question has 4 options labelled `A. `–`D. ` in order, and `answer` matches a real option.
- Word counts inside the targets above.
- `node --check app/api/cron/bcba-brief/route.js` passes.
- `RESEND_API_KEY=dummy npm run build` passes. The real key is only in Vercel; `new Resend(...)` runs at module scope, so a missing key fails the **build**, not just a send.
- Read 1–2 neighbouring days in the file first to calibrate tone — don't rely on this skill alone.
