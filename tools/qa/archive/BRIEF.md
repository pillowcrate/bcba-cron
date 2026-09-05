# BCBA Daily Brief — Authoring Brief (MANDATORY)

You are writing new entries for an existing BCBA exam-prep email series. The series already has
63 days written in a very specific voice AND at a very specific length. Your output must be
indistinguishable from the existing entries on both dimensions.

## STEP 0 — CALIBRATE (non-negotiable, do this first)

Read these exact ranges of
`/Users/benreid/Developer/Dev Projects/bcba-cron/app/api/cron/bcba-brief/route.js`:
- lines 18–72     (Days 1–3, Measurement)
- lines 1012–1064 (Days 56–58, Ethics / Supervision / DRL — most recent voice)

Do not write a word until you have read both. Day 58 (DRL) is the single best model.

## LENGTH TARGETS — MEASURED FROM THE 63 LIVE ENTRIES. HIT THESE.

A previous attempt at this task overshot by 2.4x and had to be thrown away. Length is not a
soft preference here; it is the main thing that went wrong last time. Count your words.

| field | TARGET (words) |
|---|---|
| `concept.title` | **5–9** |
| `concept.body` | **230–290** total |
| `concept.body` paragraphs | **4–5** (4 is the mode) |
| `research.summary` | **110–135** |
| `application` | **55–80** |
| question stem `q` | **8–22** |
| each option string | **3–11** |
| `rationale` | **24–38** |

For scale: `concept.body` is FOUR tight paragraphs of ~60–70 words each. That is all. It is a
dense briefing, not an essay. If you find yourself writing a fifth explanatory paragraph, you
have already overshot.

## OUTPUT FORMAT

Write ONE file at the path given in your task. It contains ONLY a sequence of JavaScript object
literals separated by commas — no array brackets, no `const`, no imports, no markdown fences, no
commentary. It gets spliced directly into an existing array.

```
  {
    day: 64, domain: "Concepts and Principles", taskCode: "B.2",
    taskDesc: "Identify and distinguish between stimulus and stimulus class",
    concept: {
      title: "...",
      body: "Paragraph one.\n\nParagraph two.\n\nParagraph three.\n\nParagraph four."
    },
    research: {
      citation: "...",
      summary: "..."
    },
    application: "...",
    questions: [
      { q: "...", options: ["A. ...", "B. ...", "C. ...", "D. ..."], answer: "C", rationale: "..." },
      { q: "...", options: ["A. ...", "B. ...", "C. ...", "D. ..."], answer: "A", rationale: "..." },
      { q: "...", options: ["A. ...", "B. ...", "C. ...", "D. ..."], answer: "D", rationale: "..." }
    ]
  },
```

Every entry ends with a trailing comma, including the last one in your file.

### Hard syntax rules
- All strings DOUBLE-quoted.
- Paragraph breaks in `concept.body` are the two-character escape `\n\n` — a literal backslash
  followed by n, twice. NEVER a real newline.
- Internal double quotes escaped as `\"`.
- Curly quotes (’ “ ”), en dashes (–) and em dashes (—) are fine and appear in the live file.
- Before finishing, verify the file parses:
  `node -e 'const fs=require("fs");const t=fs.readFileSync("YOURFILE","utf8").trim().replace(/,\s*$/,"");console.log(new Function("return ["+t+"]")().length,"OK")'`
  and print a word count per field. A syntax error breaks a production cron job.

## CONTENT RULES

**concept.body** — 4 paragraphs (5 only if genuinely needed), 230–290 words total.
- Open by framing why the concept matters clinically or on the exam. Never a dictionary opener.
- Name at least one researcher inline with a year, e.g. "Michael (1993) distinguished…".
- Break the concept into 3–4 NAMED sub-types, variants, or contrasts. This is the signature move
  of the series — see Day 1's frequency/rate/duration/latency/IRT breakdown and Day 58's
  full-session / interval / spaced-responding DRL breakdown. Roughly a third of the live entries
  use a labelled lead-in ("Latency: Latency is the elapsed time…"); that form packs a named
  sub-type into very few words and is an excellent way to hit the word budget. Use it freely.
- End with the specific point the exam most commonly gets wrong or conflates.
- No second person anywhere in `concept.body`.

**research.citation** — a full, REAL, verifiable citation.
- Journal: `Author, A. A., & Author, B. B. (Year). Title of article. Journal Name, Volume(Issue), pages.`
- Book: `Author, A. A. (Year). Title of book (edition). Publisher.`
- **NEVER fabricate.** If you are not certain of the exact authors, year, journal, volume, issue
  and pages, either (a) verify it on the web against a primary source before using it, or
  (b) fall back to a source from the certain list below. Citing a book or a BACB document is
  always safer than guessing article metadata.
- CERTAIN sources (use freely, no verification needed):
  Cooper, J. O., Heron, T. E., & Heward, W. L. (2020). Applied Behavior Analysis (3rd ed.). Pearson.
  Baer, D. M., Wolf, M. M., & Risley, T. R. (1968). Some current dimensions of applied behavior analysis. Journal of Applied Behavior Analysis, 1(1), 91–97.
  Baer, D. M., Wolf, M. M., & Risley, T. R. (1987). Some still-current dimensions of applied behavior analysis. Journal of Applied Behavior Analysis, 20(4), 313–327.
  Skinner, B. F. (1953). Science and Human Behavior. Macmillan.
  Skinner, B. F. (1957). Verbal Behavior. Appleton-Century-Crofts.
  Skinner, B. F. (1974). About Behaviorism. Knopf.
  Sidman, M. (1960). Tactics of Scientific Research. Basic Books.
  Sidman, M. (1994). Equivalence Relations and Behavior: A Research Story. Authors Cooperative.
  Michael, J. (1993). Establishing operations. The Behavior Analyst, 16(2), 191–206.
  Stokes, T. F., & Baer, D. M. (1977). An implicit technology of generalization. Journal of Applied Behavior Analysis, 10(2), 349–367.
  Herrnstein, R. J. (1961). Relative and absolute strength of response as a function of frequency of reinforcement. Journal of the Experimental Analysis of Behavior, 4(3), 267–272.
  Nevin, J. A. (1974). Response strength in multiple schedules. Journal of the Experimental Analysis of Behavior, 21(3), 389–408.
  Wolf, M. M. (1978). Social validity. Journal of Applied Behavior Analysis, 11(2), 203–214.
  Bandura, A. (1977). Social Learning Theory. Prentice-Hall.
  Behavior Analyst Certification Board. (2020). Ethics Code for Behavior Analysts. Author.
  Behavior Analyst Certification Board. (2022). BCBA test content outline (6th ed.). Author.
  Johnston, J. M., & Pennypacker, H. S. (1993). Strategies and Tactics of Behavioral Research (2nd ed.). Lawrence Erlbaum Associates.
- NOTE: Michael's 1982 paper "Distinguishing between discriminative and motivational functions of
  stimuli" is in *JEAB* 37(1), 149–155 — NOT JABA. Get this right or use Michael (1993).

**research.summary** — 110–135 words. What the cited work actually found or argued, and why it is
the reason the field does things this way. Not a restatement of concept.body.

**application** — 55–80 words, second person, addressed to a practising BCBA supervising RBTs.
Concrete, doable this week. No motivational language.

**questions** — exactly 3, scenario-based where possible rather than definition recall. Four
options each, labelled "A. " through "D. ". Vary the correct letter across your entries — never
all three the same within one entry. Each `rationale`: one sentence on why the key is right, one
clause on why the most tempting distractor is wrong. If the topic involves a calculation (IOA,
rate, percentage, trials to criterion, matching-law proportions), one question must require it and
the rationale must show the arithmetic.

## TONE
Technical, precise, graduate-level. Zero filler. Zero motivational-poster language. No emoji.
Never reference the email itself.

## FIELD VALUES
- `domain` must be EXACTLY one of: "Philosophical Underpinnings", "Concepts and Principles",
  "Measurement", "Experimental Design", "Ethics", "Behavior Assessment",
  "Behavior-Change Procedures", "Selecting and Implementing Interventions", "Personnel Supervision"
- `taskCode`, `taskDesc`, `day`, `domain` — copy EXACTLY from your assignment in ASSIGNMENTS.md.
- `concept.title` must be specific and technical, and must not merely restate `taskDesc`.
