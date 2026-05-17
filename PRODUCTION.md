# AapKaPlot — Production Rollout Checklist

> Free-stack only (per project policy). Run top to bottom on a fresh VPS.
> Each box is a single shell command or a clear UI step.

---

## 0 · Pre-flight (run on your laptop)

- [ ] `git status` clean. All Phase 1–5 changes committed.
- [ ] `npx tsc --noEmit` returns no output.
- [ ] `npm run build` succeeds locally (catches dynamic-route + SSR issues before VPS).
- [ ] Skim the diff once — no leftover `console.log("debug…")` or hard-coded test keys.
- [ ] Generate fresh secrets and store them in your password manager:
  ```bash
  openssl rand -hex 32   # JWT_SECRET
  openssl rand -hex 32   # JWT_REFRESH_SECRET
  openssl rand -hex 32   # AUTH_SECRET
  npx web-push generate-vapid-keys
  ```

---

## 1 · VPS provisioning

- [ ] VPS with ≥ 2 GB RAM, Ubuntu 24.04 LTS, public IPv4.
- [ ] DNS `A` record for `aapkaplot.com` and `www.aapkaplot.com` → VPS IP.
- [ ] SSH key-only auth (`PasswordAuthentication no`).
- [ ] `ufw` allows 22, 80, 443 only:
  ```bash
  sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
  ```
- [ ] Install Node 20+, pnpm/npm, Docker + Compose, git:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs docker.io docker-compose-v2 git
  sudo systemctl enable --now docker
  sudo usermod -aG docker $USER && newgrp docker
  ```
- [ ] Install PM2 globally: `sudo npm i -g pm2`
- [ ] Install nginx + certbot: `sudo apt-get install -y nginx certbot python3-certbot-nginx`

---

## 2 · Database (PostgreSQL + PostGIS)

- [ ] Bring up Postgres + Redis via the repo's docker-compose:
  ```bash
  git clone <repo> /srv/aapkaplot && cd /srv/aapkaplot
  npm ci
  npm run db:up           # postgres + redis containers
  ```
- [ ] Enable PostGIS extension (once):
  ```bash
  docker exec -it $(docker ps -q -f "name=postgres") psql -U postgres -d aapkaplot \
    -c "CREATE EXTENSION IF NOT EXISTS postgis;"
  ```
- [ ] Apply schema:
  ```bash
  npx prisma migrate deploy   # or: npx prisma db push  (first deploy)
  ```
- [ ] Create the GiST spatial index (one-off, required by `findNearbyProperties`):
  ```sql
  CREATE INDEX IF NOT EXISTS property_geom_idx ON "Property" USING GIST (geom);
  ```
- [ ] Backups: `pg_dump` cron — daily snapshot to off-box storage.
  ```bash
  echo '15 3 * * * docker exec postgres pg_dump -U postgres aapkaplot | gzip > /backups/akp-$(date +\%F).sql.gz' \
    | sudo tee /etc/cron.d/akp-pg-backup
  ```

---

## 3 · Environment variables (`/srv/aapkaplot/.env`)

Fill the values, then `chmod 600 .env`.

### Required for full functionality
- [ ] `NEXT_PUBLIC_SITE_URL=https://aapkaplot.com`
- [ ] `USE_DB=1`
- [ ] `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aapkaplot?schema=public`
- [ ] `REDIS_URL=redis://localhost:6379`
- [ ] `JWT_SECRET=…` `JWT_REFRESH_SECRET=…` `AUTH_SECRET=…` `NEXTAUTH_SECRET=…`
- [ ] `NEXTAUTH_URL=https://aapkaplot.com`

### Free integrations
- [ ] `IMGBB_API_KEY=…`           ← from https://api.imgbb.com (5 min signup)
- [ ] `RESEND_API_KEY=…`          ← https://resend.com 100/day free (or use Gmail SMTP)
- [ ] `GOOGLE_CLIENT_ID=…` / `GOOGLE_CLIENT_SECRET=…` ← OAuth (free)
- [ ] `VAPID_PUBLIC_KEY=…` `VAPID_PRIVATE_KEY=…` `VAPID_SUBJECT=mailto:…`
- [ ] `SENTRY_DSN=https://…@<vps>:8001/<projectId>` (after Step 4)
- [ ] `ANTHROPIC_API_KEY` blank → Cloudflare Workers AI is used. Set `CF_ACCOUNT_ID` + `CF_API_TOKEN` (free pool).

### Razorpay (test → live)
- [ ] `RAZORPAY_KEY_ID=rzp_test_…` initially. Switch to live keys only after Step 8.
- [ ] `RAZORPAY_KEY_SECRET=…`
- [ ] `RAZORPAY_WEBHOOK_SECRET=…`

### Deploy webhook (optional, for auto-pulls)
- [ ] `DEPLOY_WEBHOOK_TOKEN=…` (matches GitHub Action / manual webhook).

---

## 4 · GlitchTip (free Sentry-compatible error tracker)

- [ ] Copy compose file: `cp deploy/glitchtip.docker-compose.yml docker-compose.glitchtip.yml`
- [ ] Edit `SECRET_KEY` and `GLITCHTIP_DOMAIN` inside it.
- [ ] Start it: `docker compose -f docker-compose.glitchtip.yml up -d`
- [ ] Open `http://<vps>:8001`, create an org + project named `aapkaplot-web`.
- [ ] Paste the project DSN into `.env` as `SENTRY_DSN`.
- [ ] Verify by visiting `/error-test` in the browser → check the GlitchTip dashboard.

---

## 5 · Build + run the Next.js app

- [ ] Production build: `npm run build`
- [ ] Smoke test: `npm start -- -p 3000` then `curl -I http://localhost:3000/` returns `HTTP/1.1 200`.
- [ ] Start under PM2:
  ```bash
  pm2 start npm --name aapkaplot -- start
  pm2 save && pm2 startup
  ```
- [ ] Confirm logs are sane: `pm2 logs aapkaplot --lines 50`.

---

## 6 · nginx + TLS

- [ ] Drop in the site config:
  ```nginx
  server {
    server_name aapkaplot.com www.aapkaplot.com;
    location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_read_timeout 3600s;            # SSE: keep chat stream alive
      proxy_buffering off;                 # SSE: no buffering
    }
  }
  ```
- [ ] `sudo nginx -t && sudo systemctl reload nginx`
- [ ] TLS: `sudo certbot --nginx -d aapkaplot.com -d www.aapkaplot.com`
- [ ] HTTP→HTTPS redirect verified: `curl -I http://aapkaplot.com` → 301 to `https://…`

---

## 7 · Smoke tests on the live URL

Run from your laptop, hitting `https://aapkaplot.com`.

- [ ] `GET /` → 200, renders Hero + Nearby rail
- [ ] `GET /search` → 200
- [ ] `GET /in/kolkata` → 200, `GET /in/kolkata/projects` → 200
- [ ] `GET /in/kolkata/area/new-town` → 200, OSM Overpass call succeeds (check response time first call < 25s)
- [ ] `GET /property/<some-id>` → 200, reviews + EMI calc visible
- [ ] `GET /blog` → 200 + at least 2 MDX posts listed
- [ ] `GET /loans` → 200, rate table renders
- [ ] `GET /sitemap.xml` → 200, includes locality + project URLs
- [ ] `GET /robots.txt` → 200
- [ ] `GET /manifest.webmanifest` → 200

### Auth + writes
- [ ] Sign up via email OTP → OTP arrives via Resend / SMTP.
- [ ] Promote yourself to admin (one-off SQL):
  ```sql
  UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@…';
  ```
- [ ] Visit `/admin/verifications` → loads.
- [ ] Visit `/admin/fraud` → returns flags (or empty list).

### Seller flow
- [ ] `/sell/new` — create a listing with 3 photos → upload mode = `imgbb` in toast.
- [ ] Listing appears in `/sell/listings` as `PENDING_REVIEW`.
- [ ] As admin, approve it (set status `ACTIVE` via DB or moderation page).
- [ ] Listing now appears on `/` Nearby rail + `/search` results.

### Buyer flow
- [ ] On a property page, click Save → re-load → still saved (DB sync verified).
- [ ] Click Compare on 2 listings → floating dock → "/compare" renders table.
- [ ] Make an offer → seller's `/sell/leads` shows it.
- [ ] Enable push → `/me/saved` "Send test" button delivers a push.

### Payments (test mode)
- [ ] Boost a listing — Razorpay test card `4111 1111 1111 1111`, any future expiry, CVV 123 → success page → DB has `Payment` row → property `boostedUntil` set.

### Chat
- [ ] Open two browsers (you = buyer, admin = seller). Buyer sends message → seller sees it instantly via SSE (no refresh).

---

## 8 · Razorpay live mode (gate — only when ready)

- [ ] KYC complete on dashboard.
- [ ] Replace `rzp_test_…` keys with `rzp_live_…`.
- [ ] Set webhook URL to `https://aapkaplot.com/api/payments/verify` and copy the webhook secret.
- [ ] First real ₹1 charge to a controlled card → DB persists → refund immediately.

---

## 9 · Cron jobs

- [ ] Saved-search alerts:
  ```cron
  0 3 * * *   cd /srv/aapkaplot && pnpm exec tsx scripts/cron-alerts.ts --freq=daily
  0 4 * * 1   cd /srv/aapkaplot && pnpm exec tsx scripts/cron-alerts.ts --freq=weekly
  ```
- [ ] Verify with a test alert that fires hourly → email arrives.

---

## 10 · Monitoring + alerting

- [ ] GlitchTip project receiving events (force an error to confirm).
- [ ] `pm2 monit` shows steady RSS < 600 MB.
- [ ] Set up an `uptimerobot.com` ping on `/` every 5 min (free 50 monitors).
- [ ] Configure GlitchTip → Slack / email on `error` rate spike.
- [ ] `df -h` < 70% — add a `du -sh /var/log /var/lib/docker` weekly cron.

---

## 11 · SEO / discoverability

- [ ] Submit `https://aapkaplot.com/sitemap.xml` to Google Search Console.
- [ ] `GSC_SITE_URL=sc-domain:aapkaplot.com` in `.env` for IndexNow integration.
- [ ] Verify ownership via DNS TXT (preferred) or meta tag.
- [ ] Submit to Bing Webmaster Tools (free, free traffic).

---

## 12 · Rollback plan (do this once, document the muscle memory)

- [ ] Each deploy tags a release: `git tag -a v$(date +%Y%m%d-%H%M) -m "deploy"`
- [ ] PM2 saves the last good build under `.next-prev` (write a tiny wrapper script).
- [ ] One-liner rollback: `cd /srv/aapkaplot && git checkout <prev-tag> && npm ci && npm run build && pm2 restart aapkaplot`.
- [ ] DB schema rollbacks: never `prisma migrate reset` in prod. Add a reverse migration, deploy that.

---

## 13 · Day-2 safety

- [ ] Rate-limit nginx for `/api/auth/otp/send`, `/api/upload`, `/api/lead/offer` (per-IP).
- [ ] Disable `console.error` noise in prod by setting `NODE_ENV=production` (PM2 inherits).
- [ ] Schedule a quarterly review of: free-tier quotas (Resend, Cloudflare AI, GlitchTip), VAPID key rotation, OAuth client secrets.
- [ ] Confirm GDPR/IT-Act basics: `/privacy` matches actual data handling; reviewer note on Verification page is user-visible.

---

## What is intentionally NOT in this checklist (still parked, paid-only)

- Twilio SMS OTP — using email OTP + console fallback.
- Razorpay live — gated behind explicit user authorization (Section 8).
- Mapbox paid tier — running on the free 50k loads/mo allowance.
- DigiLocker production Aadhaar — using manual admin-approval flow.
- WhatsApp Business API — using email + push only.

Re-enable any of these only after the user gives explicit, written sign-off.
