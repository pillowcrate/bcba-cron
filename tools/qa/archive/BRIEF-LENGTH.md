# Brief: remove the longest-answer tell from BCBA newsletter questions

## The problem

In this question bank the correct option is the uniquely longest of the four in 71% of
questions (chance is 25%). A reader can score ~71% without reading the stem. You are
fixing a subset of the worst offenders.

## Your job

You are given a batch file of questions. For each one, rewrite the OPTIONS (and the
rationale if it depends on them) so that option length no longer signals the answer.

## Hard constraints — violating any of these is a failure

1. **Do not change the `answer` letter.** The correct option must stay in the same
   position (A/B/C/D). Letter balance across the bank is exactly 84/84/84/84 and must
   not move.
2. **Keep the `"A. "`, `"B. "`, `"C. "`, `"D. "` prefixes** on every option, in order.
3. **The correct option must remain unambiguously correct** and every distractor must
   remain unambiguously **wrong** to a competent BCBA. This is the constraint that
   matters most. A distractor that becomes partially true, arguably true, or true under
   some reading is worse than the length tell you were sent to fix.
4. Exactly four options. Never introduce "all of the above", "none of the above", or
   "both A and B".

## Length target

Measured on the option text **excluding** the `"A. "` prefix:

- The correct option must **not** be the longest. Aim for it to land 2nd or 3rd longest.
- All four options within **25%** character length of each other.
- Count the characters and check this before you write your output. Do not estimate.

## How to hit the target

Two moves, used together. Do not pad with filler.

- **Trim the correct option** to its essential claim. The worst offenders are correct
  answers stated as a five-item enumeration against three one-line distractors. Cut the
  enumeration to the part that carries the discrimination; the full list belongs in the
  rationale, not the option.
- **Raise the distractors to matching specificity.** A good distractor states a wrong
  idea at the same level of detail as the right one — a real misconception a struggling
  candidate holds, stated concretely. Added words must add *wrongness*, not hedging.
  Turning "Calculating interobserver agreement" into "Calculating interobserver
  agreement across independent observers" is good. Turning it into "Possibly helping
  with interobserver agreement in some cases" is bad — vague hedging is its own tell.

## Rationale

Update the rationale **only if** it names or discusses distractor wording you changed.
Keep it 24–38 words. It should say why the keyed answer is right and, where the original
did so, why the named distractors are wrong.

## Style

Match the existing entries. Em dashes (—) not double hyphens. Curly apostrophes are used
in the file; plain ones are acceptable. Prefer single quotes for any inner quoting.
No markdown inside the strings.

## Output

Write a JSON file to the path you are given. An array of objects, one per question in
your batch, in the same order:

```json
[
  {
    "id": "d34q3",
    "line": 1234,
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "C",
    "rationale": "...",
    "lens": [72, 68, 70, 66],
    "note": "trimmed the correct enumeration to metric + criterion + consistency; raised A and D to matching specificity"
  }
]
```

`lens` is your own character count of each option excluding the prefix — write the real
numbers, they are checked mechanically against your `options` and a mismatch fails the
batch. Do not include `q` (the stem is unchanged). If you genuinely cannot fix a question
without making a distractor defensible, omit it from the output and explain why in your
final message rather than shipping a compromised version.

## Return

Your final message: how many you rewrote, how many you omitted and why, and any question
where you are less than confident the keyed answer is still the only defensible one.
Name those by id — they get checked by hand.
