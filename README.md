# bcba-cron

Daily BCBA exam prep email, sent Monday–Friday at 6:00 AM Mountain Time via Resend and Vercel Cron.

No UI. No database. One route, one email.

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd bcba-cron
npm install
```

### 2. Add your content

Open `app/api/cron/bcba-brief/route.js` and paste your 42 day objects into the `DAYS` array. Each object follows this shape:

```js
{
  domain: "Measurement",
  taskCode: "A-01",
  concept: "Continuous Measurement",
  conceptBody: "First paragraph.\n\nSecond paragraph.",
  citation: "Cooper, Heron & Heward (2020), p. 91",
  citationSummary: "One-sentence summary of the research finding.",
  clinicalApplication: "How to apply this in practice.",
  questions: [
    {
      q: "Which of the following is an example of continuous measurement?",
      options: ["A. Duration", "B. Momentary time sampling", "C. Partial interval", "D. Whole interval"],
      correct: 0,   // zero-based index
      rationale: "Duration captures every instance of the behavior.",
    },
  ],
}
```

### 3. Create your `.env.local`

```bash
cp .env.example .env.local
```

Fill in the values:

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | From [resend.com/api-keys](https://resend.com/api-keys) |
| `CRON_SECRET` | Any strong random string — generate with `openssl rand -hex 32` |

`RESEND_API_KEY` must be available at **build** time, not just at runtime: the Resend client is
constructed at module scope, so a missing key fails `next build` rather than just a send.

Which day gets sent is no longer derived from a `START_DATE` variable. It comes from
`ROTATION_ANCHOR` in `app/api/cron/bcba-brief/route.js`:

```js
const ROTATION_ANCHOR = { date: "2026-09-03", dayNumber: 15 };
// index = (dayNumber - 1 + countWeekdays(date, today)) % DAYS.length
```

**If you add or remove days, restamp the anchor** to the date of the most recent send and the day
number that send actually displayed (read it from the email subject line). Changing
`DAYS.length` without restamping makes the printed counter jump.

---

## Deploy to Vercel

### 1. Push to GitHub, then import in Vercel

Create a new project at [vercel.com/new](https://vercel.com/new) and import your repo.

### 2. Add environment variables

Go to **Settings → Environment Variables** and add:

- `RESEND_API_KEY`
- `CRON_SECRET`

Both should be set for Production (and Preview if you use it).

### 3. Deploy

Vercel reads `vercel.json` automatically. The cron job is registered on deploy.

---

## Verifying the cron fires

1. Open your project in the Vercel dashboard.
2. Go to **Functions → Cron Jobs**.
3. You'll see `0 12 * * 1-5` listed with last-run status and logs.

---

## Manually triggering for testing

Hit the route directly with your `CRON_SECRET`:

```bash
curl -H "Authorization: Bearer <your-cron-secret>" \
  https://<your-vercel-url>/api/cron/bcba-brief
```

A successful send returns:

```json
{ "ok": true, "day": 1, "concept": "Continuous Measurement" }
```

---

## Timezone note

The cron schedule `0 12 * * 1-5` targets **6:00 AM MDT (UTC-6)**, which is Mountain Daylight Time (March–November).

When clocks fall back in **November**, Mountain Time becomes **MST (UTC-7)**. Update `vercel.json` at that point:

```json
"schedule": "0 13 * * 1-5"
```

Then redeploy. Revert to `0 12 * * 1-5` in March when DST resumes.
