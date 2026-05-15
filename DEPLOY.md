# AapKaPlot — Deployment Guide

This is the end-to-end production setup on **Cloudflare**: Pages for hosting, R2 for media, Turnstile for OTP bot-check, optional Workers AI as a second LLM. Nothing here breaks local dev — every key has a graceful fallback.

---

## 1) Prerequisites

| What | Why | Where to get it |
|---|---|---|
| Cloudflare account | Hosts everything | https://dash.cloudflare.com |
| Domain on Cloudflare DNS | Pretty URL + CDN | Add domain in dashboard, point registrar nameservers |
| API token | DNS + Pages deploy | My Profile → API Tokens → "Create Token" → use the **Edit Cloudflare Pages** template |
| Account ID | All wrangler commands | Right sidebar of dashboard home |
| Zone ID | DNS scripts | Right sidebar of your domain's overview |

> ⚠️ Treat the token as a secret. Never commit. Put it in `.env.local` (gitignored) for local scripts and as a GitHub Actions secret for deploys.

---

## 2) One-time setup

### 2a. Create the R2 bucket

```bash
npx wrangler r2 bucket create aapkaplot-media
npx wrangler r2 bucket create aapkaplot-media-preview
```

Then generate an **R2 API token** in the dashboard (R2 → Manage R2 API Tokens → Create token, scope to the bucket above). Add to `.env.local`:

```bash
R2_ACCOUNT_ID=<your account id>
R2_ACCESS_KEY_ID=<from the R2 token>
R2_SECRET_ACCESS_KEY=<from the R2 token>
R2_BUCKET=aapkaplot-media
R2_PUBLIC_BASE=https://media.aapkaplot.com   # after DNS step below
```

The seller upload form at `/sell/new` automatically routes through R2 once these are set; otherwise it falls back to data-URL previews.

### 2b. Turn on Turnstile

Cloudflare dashboard → **Turnstile → Add a site**. Pick "Managed" widget. Copy:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET=...
```

`/auth/login` now requires a passing challenge before the OTP send route accepts the request.

### 2c. (Optional) Workers AI

```bash
CF_ACCOUNT_ID=<account id>
CF_API_TOKEN=<a token with Workers AI: Read+Run perms>
```

`/api/ai/describe` will use Workers AI when Claude (`ANTHROPIC_API_KEY`) is not configured.

### 2d. Wire up DNS

Run the bootstrap script after putting the zone id + token in your shell:

```bash
CLOUDFLARE_API_TOKEN=<token> \
CLOUDFLARE_ZONE_ID=<zone id> \
SITE_DOMAIN=aapkaplot.com \
npx tsx scripts/cf-dns-bootstrap.ts
```

This adds the apex + `www` CNAMEs to `aapkaplot.pages.dev` and a `media.aapkaplot.com` record for R2.

---

## 3) First deploy

### Option A — Connect Pages to GitHub (recommended)

1. Dashboard → **Pages → Create application → Connect to Git**
2. Choose this repo, branch `main`
3. Build command: `npx @cloudflare/next-on-pages@latest`
4. Output directory: `.vercel/output/static`
5. Add the environment variables from your `.env.local` (skip the dev-only ones)

Every push to `main` redeploys automatically.

### Option B — GitHub Actions (zero-touch)

Add two repository secrets in GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The included workflow `.github/workflows/deploy.yml` will deploy on push to `main`.

### Option C — Manual

```bash
npm run build
npx @cloudflare/next-on-pages@latest
npx wrangler pages deploy .vercel/output/static --project-name aapkaplot
```

---

## 4) Environment variables checklist

| Var | Where set | Purpose | Fallback if absent |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | All | Canonical URLs / OG | `https://aapkaplot.com` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | All | Interactive map | CSS art map |
| `JWT_SECRET` | All | Session cookie HMAC | Dev placeholder (rotate before prod) |
| `R2_*` | Pages + local | Property image upload | Data-URL previews |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET` | Pages | OTP bot-check | Verification skipped |
| `ANTHROPIC_API_KEY` | Pages | AI listing descriptions | Template bank |
| `CF_ACCOUNT_ID` + `CF_API_TOKEN` | Pages | Workers AI | Anthropic → templates |
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | Pages | Real payments | Simulated `order_sim_*` |
| `DATABASE_URL`, `USE_DB=1` | Pages | Postgres data layer | In-memory mock catalogue |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Pages | Google OAuth | OTP only |

---

## 5) Post-deploy verification

```bash
curl -fsSL https://aapkaplot.com/manifest.webmanifest >/dev/null    && echo "✓ manifest"
curl -fsSL https://aapkaplot.com/sitemap.xml         | head -1     && echo "✓ sitemap"
curl -fsSL https://aapkaplot.com/api/auth/me         | jq          && echo "✓ session api"
```

Check inside the app:

- `/admin/events` should show the live tracker (any save/share/visit fires an event)
- `/sell/new` photos step uploads to R2 — toast says "Uploaded to R2"
- `/auth/login` shows the Turnstile widget; OTP only sends after solving

---

## 6) Rotating credentials

If a token ever leaks:

1. Cloudflare dashboard → My Profile → API Tokens → **Roll** or **Delete**
2. Regenerate, update `.env.local` (local) + GitHub secrets (CI) + Pages env vars (prod)
3. Restart the dev server. Pages will auto-rebuild on the next push.
