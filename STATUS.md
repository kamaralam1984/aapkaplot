# AapKaPlot — Site Status Audit

> Snapshot as of **2026-05-18**. Maintained loosely; re-verify before
> any external announcement. Legend: ✅ working, ⚠️ partial / mock,
> ❌ missing, 🔴 known bug / security issue.

---

## 1 · What's working end-to-end ✅

### Authentication & session
- ✅ Email + OTP signup (`/auth/signup`) — collects name, phone (+91), email, address, role.
- ✅ Email + OTP login (`/auth/login`).
- ✅ Google OAuth (`/auth/login` → "Continue with Google") → `/api/auth/oauth-bridge` → app session.
- ✅ Session cookie `akp_session` (30-day JWT, signed).
- ✅ Logout (`/api/auth/logout`) clears cookie.
- ✅ Super admin allowlist (`SUPER_ADMIN_EMAILS` env auto-promotes on first sign-in).
- ✅ Session-aware navbar — avatar + dropdown when signed in.
- ✅ `/me/settings` — editable name, phone, WhatsApp number, address (`/api/me/profile`).

### Property posting (seller)
- ✅ `/sell/new` 5-step wizard (Property → Location → Photos → Price → Review).
- ✅ Multi-unit area input (sqft, sqm, sqyd, katha, bigha, acre, hectare).
- ✅ Live MapLibre picker with **GPS auto-detect**, drop-pin mode, draw-boundary polygon.
- ✅ Photo upload (20 MB, multiple files, HEIC/PNG/JPEG/WebP/AVIF/GIF/MP4) → ImgBB or local.
- ✅ Road frontage fields (N/E/S/W in feet).
- ✅ AI description draft — provider chain OpenAI → CF Workers AI → Claude → template.
- ✅ Submit → `Property.status = PENDING_REVIEW` → admin queue.

### Property editing & lifecycle
- ✅ Edit (`/sell/edit/[id]`) — owner edits via `PATCH /api/seller/property/[id]`.
- ✅ Admin edit (`/admin/properties/edit/[id]`) — same form, owner-agnostic.
- ✅ Pause / Resume (`POST /api/seller/properties`).
- ✅ Soft delete (`DELETE /api/seller/property/[id]` → status REJECTED).
- ✅ Cache bust on edit (revalidatePath fires on PATCH).

### Public discovery
- ✅ Homepage with hero, nearby rail, top picks, AI rec, YouTube rail, ads.
- ✅ Hero MapPreview fetches `/api/property/nearby` with PostGIS distance.
- ✅ Search (`/search`) — real DB via `runSearch()` + `listProperties()`, filters work (kind, intent, budget, BHK, area, radius, amenities, verified).
- ✅ Property detail (`/property/[id]`) — DB-or-mock resolver, ISR revalidate 60s.
- ✅ Distance + nearby rails on property page.

### Owner ↔ buyer flow
- ✅ Lead create — buyer fills "Make an offer" or "Show Phone Number" → `Lead` row created.
- ✅ Phone reveal API (`/api/lead/reveal`) — daily rate limit per buyer.
- ✅ Seller leads inbox (`/sell/leads`) — real DB via `/api/seller/leads`.
- ✅ Owner's own listing — Make Offer and Phone Reveal hidden, "This is your listing" panel.
- ✅ Visit request (`ScheduleVisitForm`).

### Admin panel
- ✅ Overview (`/admin`) — KPIs from real prisma.
- ✅ Properties (`/admin/properties`) — list + Approve / Reject / Pause / Edit / Delete actions, audit-logged.
- ✅ Users (`/admin/users`) — list + role change.
- ✅ Moderation (`/admin/moderation`) — PENDING_REVIEW properties + approve/reject.
- ✅ Fraud (`/admin/fraud`) — server-side heuristic scanner.
- ✅ Analytics (`/admin/analytics`) — real counts (users, listings, leads, revenue, signups).
- ✅ Ads (`/admin/ads`) — Payment-table revenue + per-plan breakdown.
- ✅ Heatmap top zones — real top localities by ACTIVE listing count.
- ✅ Performance (`/admin/performance`) — Google PageSpeed scans, parallel mobile + desktop.
- ✅ System log (`/admin/system-log`) — tail of PM2 process logs.
- ✅ Audit log (`/admin/audit`) — AdminAuditLog rows.
- ✅ Events (`/admin/events`) — live event feed.
- ✅ Database inspector (`/admin/database` + `/admin/database/[table]`) — row counts + viewer for all 19 Prisma models.
- ✅ Visitors (`/admin/visitors`) — live tracking with Cloudflare geo, 10-second polling.
- ✅ Verifications (`/admin/verifications`) — Aadhaar packet review queue.

### Operations
- ✅ PM2 + Cloudflare Tunnel on Hostinger VPS.
- ✅ One-command deploy (`bash deploy/vps-setup.sh`) — pulls, installs, prisma db push, builds, reloads PM2.
- ✅ Coexists with `vidyt.com` on the same VPS (different process, different port).
- ✅ GitHub Actions workflow exists (currently broken — see §4).

### SEO & marketing
- ✅ Per-page metadata (title, description, OG, Twitter).
- ✅ JSON-LD on homepage + property pages.
- ✅ Favicon (`app/icon.tsx`), apple-icon, OG image (1200×630).
- ✅ PWA manifest with SVG + raster icons.
- ✅ Sitemap (`/sitemap.xml`) + robots.
- ✅ Hindi/English i18n toggle (basic).

### Legal pages
- ✅ `/terms` — full Terms of Service.
- ✅ `/privacy` — Privacy Policy.
- ✅ `/cookies` — Cookie Policy.
- ✅ Footer links to all three.

---

## 2 · Partial / mock-backed ⚠️

These pages **render** and look polished, but the data is mocked or
the feature is scaffolded only.

- ⚠️ **Buyer dashboard `/me`, `/me/saved`, `/me/alerts`, `/me/recommendations`, `/me/visits`** — uses mock data when DB is empty; auth-only but contents not all wired to live tables.
- ⚠️ **Chat (`/chat`, `/chat/[id]`)** — `ChatLive` component exists, SSE stream + messages API wired, but conversation list still uses `MOCK_CONVERSATIONS`; full end-to-end test pending.
- ⚠️ **Reviews (`PropertyReviews` component)** — UI complete, backed by `/api/reviews` route but not yet stress-tested.
- ⚠️ **Verifications** — `/me` user can upload Aadhaar via `/auth/verify-docs`, admin can approve, but there is no DigiLocker / e-KYC integration; trust is purely manual.
- ⚠️ **Heatmap chart (`/admin/heatmap`)** — top zones are live; the 24×7 search heatmap itself is a demo visualization (labeled in UI). Will switch to real Event data once enough sessions land.
- ⚠️ **Broker portal (`/broker/*`)** — pages render, BrokerProfile / BrokerReferral / Commission models exist, but flow isn't user-tested.
- ⚠️ **Boost / Featured (`/sell/boost`, `/checkout`)** — UI complete, **Razorpay is disconnected**; all payment paths are simulated.
- ⚠️ **Make an Offer accept / decline** — buyer can submit offer (Lead row + offerAmountInr saved); seller sees it in `/sell/leads` but in-app accept / decline / counter buttons not yet added.
- ⚠️ **Push notifications** — PushSubscription table + `lib/push.ts` exist, no actual VAPID-backed push wired.
- ⚠️ **Email notifications** — `lib/email.ts` is the OTP-send path; transactional notifications (offer received, listing approved) aren't fired.
- ⚠️ **Sell/analytics (`/sell/analytics`)** — mock charts.
- ⚠️ **AI Fraud detection** — works via deterministic heuristics; no ML model.
- ⚠️ **Compare (`/compare`)** — works with `useCompare()` hook in client only; persists per-browser.

---

## 3 · Missing / not implemented ❌

- ❌ **Real payments** — Razorpay was wired then disconnected. No Stripe / PayU / UPI direct integration yet. All "Boost ₹499" buttons are demos.
- ❌ **WhatsApp Business** integration — owner phone reveals show a wa.me link but there's no inbound chat handler.
- ❌ **SMS OTP** — only email OTP works. Phone-OTP path is stubbed (`phone: "email:..."` sentinel for old rows).
- ❌ **Aadhaar / DigiLocker e-KYC** — image upload only; no government API.
- ❌ **Email transactional templates** — only OTP. No "your listing was approved", "you have a new lead", "price drop alert" emails.
- ❌ **Daily AI recommendations / alerts** — `SavedSearch` table exists, no cron job sends matches.
- ❌ **Project listings (`/in/[city]/projects/[slug]`)** — page renders but no builder/Project create flow for sellers.
- ❌ **AI Insights on property page** — `PropertyAIInsights` renders mock numbers; needs real ML or LLM-driven analysis.
- ❌ **Cohort retention chart** in `/admin/analytics` — labeled as sample.
- ❌ **GA + AdSense** — env vars present but disabled by default; needs domain re-verification.
- ❌ **Loan application** (`/loans`) — calculator only; no partner-bank handoff.
- ❌ **Referral payout** — referral codes generated, no commission auto-calc beyond Broker flow.
- ❌ **Mobile app** — web-only; no React Native build.
- ❌ **Multi-language full coverage** — only hero / nav / footer translated; rest is English.

---

## 4 · Known bugs / open issues 🔴

| ID | Description | Severity |
|---|---|---|
| 🔴 1 | GitHub Actions deploy workflow returns 401 (DEPLOY_WEBHOOK_TOKEN mismatch between GH Secrets and VPS .env.local). Every push currently fails CI; deploys are manual `bash deploy/vps-setup.sh`. | High |
| 🔴 2 | GitHub PAT `ghp_tK4mD...` leaked in this conversation history. Must be revoked. | High |
| 🔴 3 | Razorpay live keys exposed in `.env` and conversation history. Should be regenerated even though Razorpay is currently disconnected. | Medium |
| 🔴 4 | PageSpeed API key `AIzaSyCa...` exposed. Should be regenerated in Google Cloud Console. | Medium |
| 🔴 5 | OpenAI + Anthropic keys present in `.env` but not verified rotated since the leak window. | Medium |
| 🔴 6 | Mobile Performance score still ~56 (LCP ~3.75 s, INP ~11.9 s). LCP fixed; INP needs framer-motion → CSS codemod across remaining 50+ components. | Medium |
| 🔴 7 | Cloudflare visitor headers (`cf-ipcity`, `cf-iplatitude`, etc.) need IP-Geolocation toggle ON in CF dashboard for `/admin/visitors` city/lat fields to populate. | Low |
| 🔴 8 | Service Worker may serve stale assets on repeat visits; `pm2 update` warning shows the VPS PM2 version mismatch. | Low |
| 🔴 9 | `/property/[id]` for listings with `areaSqft=0` showed garbage `/sqft` — cosmetic-patched; existing rows still need owner-edit to set real area. | Low |
| 🔴 10 | Distance-based "X km away" badges fall back to Kolkata default when device location unknown — fixed in MapPreview, may still appear in NearbyRail/property cards. | Low |

---

## 5 · Security / operational action items

1. **Revoke leaked GitHub PAT** (`ghp_tK4mDyL...`) — GitHub → Settings → Developer settings → Personal access tokens.
2. **Rotate Razorpay live keys**, **PageSpeed API key**, **OpenAI / Anthropic keys**. Update `.env.local` on VPS.
3. **Fix GitHub Actions** — copy VPS-side `DEPLOY_WEBHOOK_TOKEN` into the GitHub repo secret of the same name; re-run failed deploy job.
4. **Run `pm2 update`** on VPS once to clear the version-mismatch warning.
5. **Enable Cloudflare IP Geolocation** (Network → IP Geolocation = ON) for `/admin/visitors` to show city / lat / district.
6. **Verify SUPER_ADMIN_EMAILS** is set on VPS `.env.local` and limited to owners.
7. **Schedule a backup** — `pg_dump aapkaplot` to off-site (S3 / R2) once per day.

---

## 6 · Recommended next priorities (when product time opens up)

1. **End-to-end Offer accept / decline** — biggest UX gap; sellers can't act on offers in-app.
2. **Real payments** — reconnect Razorpay (or move to PayU/Stripe) so Boost / Premium plans monetise.
3. **Transactional email** — at minimum: listing approved, new lead, offer received.
4. **Daily AI alerts cron** — match `SavedSearch` rows against new ACTIVE properties and email/push.
5. **Mobile INP optimisation** — framer-motion → CSS codemod on remaining 50+ components targeting < 500 ms INP.
6. **Photo gallery on property page** — currently shows cover only; gallery exists in DB but lightbox not wired.
7. **Buyer dashboard live wiring** — `/me/saved`, `/me/alerts`, `/me/visits` reads from real Favorite / SavedSearch / VisitRequest tables.

---

## 7 · Page inventory (count from `find app -name page.tsx`)

- **Public**: 24 routes (homepage, search, property detail, city pages × 5 patterns, blog × 2, about/contact/careers/press/help/loans/pricing/referrals/compare/sitemap, terms/privacy/cookies, ai-technology).
- **Auth-required**: 43 routes (admin × 20, seller × 8, buyer × 6, auth × 4, broker × 6, chat × 2, checkout × 1).
- **Total**: 67 routes.

SEO-indexable URLs are higher because dynamic params (`/in/[city]`, `/property/[id]`, `/blog/[slug]`) generate 200+ rendered pages.
