# Cron endpoints

All routes here are authenticated by `CRON_SECRET` (header `x-cron-secret`,
or `?key=` query, or `Authorization: Bearer …`).

Set up free schedulers on [cron-job.org](https://cron-job.org) or
[uptimerobot.com](https://uptimerobot.com) — both work with simple GET pings.

| Route | Recommended schedule (IST) | What it does |
|---|---|---|
| `/api/cron/seo-generate` | `0 4 * * *` (04:00) | Generates up to 100 SEO pages/day |
| `/api/cron/auto-match-daily` | `0 8 * * *` (08:00) | AI-shortlists last-24h inquiries → admin digest |
| `/api/cron/auto-followup` | `0 10 * * *` (10:00) | Drafts followup for 3+ day silent grahaks |

## Example cron-job.org setup

For each route create a job with:

- **URL**: `https://aapkaplot.com/api/cron/<name>?key=YOUR_CRON_SECRET`
- **Method**: GET
- **Schedule**: see table above (use IST → UTC if the scheduler is UTC-based)
- **Timeout**: 300 seconds (these can take a few minutes)

## What auto-fires without a cron

The `/api/lead/inquiry` POST handler fires an **instant auto-reply** in
fire-and-forget mode the moment the form is submitted:

1. Generate AI shortlist (top 3 active listings) for the grahak.
2. Draft a personalised email + WhatsApp text.
3. If `email` is on the inquiry → email is sent to the grahak.
4. Admin always gets a notification email with a `wa.me/...` deep-link
   that opens WhatsApp with the drafted message pre-filled.

State is tracked on `Inquiry`:
- `autoReplySentAt` — prevents duplicate auto-replies.
- `aiReplyDraft` — JSON of last draft (subject + email + WA).
- `aiShortlistJson` — last matched property IDs + scores + reasons.
- `lastFollowupAt`, `followupCount` — limits followups to max 2 per lead.

## Required env vars

```bash
CRON_SECRET=...               # openssl rand -hex 32
OPENAI_API_KEY=sk-...         # required for AI-quality drafts (paid)
ADMIN_NOTIFY_EMAIL=animesh@freedomwithai.com   # digest recipient
RESEND_API_KEY=...            # OR SMTP_HOST/USER/PASS — for delivery
NEXT_PUBLIC_SITE_URL=https://aapkaplot.com
```

If `OPENAI_API_KEY` is missing, all three jobs still run — they just use a
deterministic template fallback (less personalised, still usable).
