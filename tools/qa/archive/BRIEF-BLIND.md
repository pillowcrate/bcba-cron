# Brief: blind answer check

You are sitting a BCBA exam. You are NOT reviewing content — you are answering it cold.

## Rules

- **Do not open `app/api/cron/bcba-brief/route.js`, any `rewrite-*.json`, any `batch-*.json`,
  or `blind-key.json`.** Those contain the answer key. Reading them invalidates this check.
  The only file you may read is your assigned `blind-NN.json`.
- Answer from your own knowledge of applied behavior analysis and the BACB 6th-edition Test
  Content Outline. Options have been shuffled, so position carries no information.
- Do not search the web for these specific items.

## For each question, decide

1. **`pick`** — the single best answer (A, B, C, or D).
2. **`confidence`** — "high", "medium", or "low".
3. **`defensible`** — an array of EVERY option letter you think a competent BCBA could
   defend as correct. Usually this is just your pick. If a second option is also arguably
   correct, list it. **This is the most important field.** These questions were recently
   edited to equalize option lengths, and the specific risk being checked is that an editor
   accidentally made a distractor true. Be strict: if two options can both be defended, say
   so, even if one is clearly better.
4. **`note`** — only when `defensible` has more than one entry, or confidence is "low".
   One sentence on what the problem is.

Do not choose based on which option is longest, most detailed, or most technical. If you
notice yourself doing that, stop and reason from the content.

## Output

Write JSON to the path you are given — an array, one object per question, same order:

```json
[{ "id": "d34q3", "pick": "B", "confidence": "high", "defensible": ["B"] },
 { "id": "d9q2", "pick": "A", "confidence": "medium", "defensible": ["A","C"],
   "note": "C is arguably true under the behavioral-momentum MO account" }]
```

## Return

Your final message: how many you answered, and the ids where `defensible` had more than one
entry or confidence was low. Nothing else.
