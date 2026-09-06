# Wave 3 sources — verification record (2026-09-06)

All citations verified against Crossref (authors, year, journal, volume, issue, pages) BEFORE
authoring, and re-verified independently afterwards by a fact-checking agent. **No citation
string errors were found in the shipped days.**

| Day | Task | Citation | Crossref | Full text? |
|---|---|---|---|---|
| 123 | F.1 | O'Reilly (1997). *JABA*, 30(1), 165–167. `10.1901/jaba.1997.30-165` | exact | **No** — PMC1284030 is scanned images, no text layer |
| 124 | F.5 | Vollmer, Borrero, Wright, Van Camp & Lalli (2001). *JABA*, 34(3), 269–287. `10.1901/jaba.2001.34-269` | exact | **No** — PMC1284322 scanned; Europe PMC fullTextXML empty |
| 125 | F.6 | Bloom, Iwata, Fritz, Roscoe & Carreau (2011). *JABA*, 44(1), 19–31. `10.1901/jaba.2011.44-19` | exact | **Yes** — see route note below |
| 126 | F.6 | **Jessel, Hanley & Ghaemmaghami (2016). *JABA*, 49(3), 576–595. `10.1002/jaba.316`** | exact | **No** — not deposited in PMC; Crossref abstract is unusually detailed |
| 127 | F.4 | Roscoe, Iwata & Kahng (1999). *JABA*, 32(4), 479–493. `10.1901/jaba.1999.32-479` | exact | **Yes** — see route note below |
| 128 | F.6 | Hagopian, Rooker & Zarcone (2015). *JABA*, 48(3), 523–543. `10.1002/jaba.236` | exact | **Yes** — BioC API, saved at `src/PMC4830359.txt` |

**Two corrections to an earlier draft of this file, both caught by the fact-checking agent:**

1. Day 126 was originally planned around **Hanley, Jin, Vanselow & Hanratty (2014)**, `10.1002/jaba.106`.
   It was switched mid-authoring to **Jessel et al. (2016)** because the 2014 abstract describes only
   the assessment-and-treatment *outcome* and does not describe the IISCA procedure, while the 2016
   abstract states the method, the 30 replications, the 25-minute average and the 3–5 minute reanalysis
   result explicitly. Hanley et al. (2014) is credited in `concept.body` prose as the origin of the
   method. The earlier version of this file still named the 2014 paper — it was wrong.
2. Full text for **Bloom and Roscoe was obtained by WebFetch against the PMC HTML article page**, not
   by the BioC/efetch APIs. Those APIs failed for every pre-2015 JABA record, and the failure stubs
   (`src/PMC3050467.txt`, `src/PMC1284210.txt` containing `NO-BODY`) are the residue of those attempts.
   Do not read those stubs as evidence the text was unavailable — it was available, by a different route.

## Supporting works cited in body prose only (verified, not used as `research.citation`)

- Northup, Wacker, Sasso, Steege, Cigrand, Cook & DeRaad (1991). *JABA*, 24(3), 509–522 — brief FA.
- Smith & Churchill (2002). *JABA*, 35(2), 125–136 — precursor FA. No text layer.
- Roane, Lerman & Vorndran (2001). *JABA*, 34(2), 145–167 — progressive ratio. No text layer.
- Hanley, Jin, Vanselow & Hanratty (2014). *JABA*, 47(1), 16–36 — origin of the IISCA.

## Do-not-"improve" list

Days 123, 124 and 126 have `research.summary` written **from the abstract only, by design**. No
participant-level detail, no numbers beyond what the abstract states. Same constraint as Richman
et al. (1988) in Wave 2. A reviewer noticing they are thin is right; a reviewer who thinks that is
fixable is not.

**O'Reilly's hedge is the author's own** — *"may have served as an establishing operation related to
escape from ambient noise."* Preserve it.

**Hagopian's subtype labels are explicitly speculative** — *"If one were to apply descriptive terms…
the terms sensory, strong sensory, and mixed sensory SIB might be reasonably applied."* Day 128
presents them as speculation about mechanism. Do not promote them to findings.

## Verified quotes that load-bearing claims rest on

- Bloom, on the counterintuitive timing claim in `d125q3`: *"Not counting time spent waiting for
  appropriate opportunities to conduct trials, the mean total durations of the trial-based and
  standard functional analyses were 4 hr 31 min and 3 hr 53 min, respectively."* And: *"Overall
  efficiency, however, does not appear to be an advantage of the trial-based procedure."*
- Bloom, on Jonas (a fact-checker flagged this as unverifiable; it is verifiable, by fetching the
  PMC HTML page rather than the API): test segments were lengthened to 5 min with 1-min controls, and
  *"Under this arrangement, his problem behavior occurred only during the test segments."*
- Hagopian, the headline treatment result: *"Reinforcement was effective for most individuals with
  Subtype 1 (8 of 12)… In contrast, reinforcement was not effective for anyone with Subtype 2 (zero
  of seven)."*
- Roscoe: 8 participants; 7 of 8 allocated to the high-preference stimulus under concurrent schedules;
  6 of those 7 responded at high-preference-equivalent rates under a single schedule.

## Corrections applied after fact-checking

Seven claims were tightened before commit, all found by the verification pass:

| Day | Was | Now | Why |
|---|---|---|---|
| 127 | "ranked last in an **MSWO**" | "ranked last in a **paired-stimulus** preference assessment" | Roscoe used single- and paired-stimulus methods. It never used MSWO; attributing the finding to MSWO extrapolated to a stimulus class the study did not test. |
| 127 | "paired-stimulus or multiple-stimulus assessment" | "competitive preference assessment" | same reason |
| 128 | "thirty-nine percent Subtype 2" | "thirty-eight percent" | 15/39 = 38.5% |
| 128 | competing stimuli found "far more often" | "for a larger proportion of Subtype 1 cases" | 100% vs 71.4%/40%. The authors' word is "smaller proportion". |
| 128 | "less to more **restrictive** intervention" | "less to more **intensive**" | the authors' sentence says "intensive" |
| 126 | "**most** alternative formats" | "**multiple** alternative formats" | abstract says "Multiple FA formats" |
| 125 | "**recommended** longer test segments" | "**suggested** longer test segments… might improve accuracy" | the paper hedges it as a possible refinement, and its own supplemental analysis suggested 4-min segments would suffice |
| 124 | "the **difference** between them is the contingency value" | "Vollmer and colleagues **termed that comparison** a contingency value" | the abstract does not specify difference vs ratio; asserting the operation overreached the source |
