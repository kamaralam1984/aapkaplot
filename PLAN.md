# AapKaPlot — Missing Features Build Plan (Free-Stack)

> Goal: ship every gap identified in the audit using **only free-tier APIs / OSS**, no paid services until the user authorizes them. Today's date: 2026-05-16.

---

## 🧱 Free-stack chart (one-time choices)

| Concern | Free choice | Why this pick | Limits |
|---|---|---|---|
| Image storage | **ImgBB API** (selected) | Anonymous-friendly, simple POST, returns CDN URL, no monthly cap published, no egress fee | 32 MB / image. Need API key (free signup). |
| Database | PostgreSQL on VPS (already running) | Self-hosted, PostGIS for nearby | Disk-bound. |
| Realtime | `socket.io` self-host on VPS | Already partially scaffolded | None. |
| Email (alerts, OTP) | Existing SMTP (Gmail) → fallback to **Resend free** (100/day) | Already configured | 100 emails/day on Resend free. |
| Push notifications | `web-push` + VAPID keys (self-generated) | Browser-native, $0 forever | Web only. |
| i18n | `next-intl` npm lib | OSS, SSR-friendly | None. |
| Maps base layer | **Leaflet + OpenStreetMap** as fallback when Mapbox token blank | OSM tiles are free with attribution | Heavy traffic needs tile cache. |
| Geocoding | **Nominatim** (OSM) | Free with 1 req/s policy | Need caching layer. |
| Locality POIs | **Overpass API** (OSM) | Free, no key | Rate-limited, cache results. |
| Error tracking | **GlitchTip** self-hosted on VPS (Docker) | Sentry-compatible SDK | 1 GB RAM container. Sentry free tier is alternative. |
| AI | **Cloudflare Workers AI** (already wired) + free OpenRouter models | $0 if within Cloudflare neurons free pool | Already configured. |
| EMI / financial calc | Pure JS | None needed | — |
| Cron | Existing `node-cron` already wired | Already configured | — |
| Search (fuzzy) | Postgres FTS5/`pg_trgm` extension | Already have Postgres | — |
| Video / 360° tour | Store URL only — embed YouTube/Vimeo unlisted | Free, zero storage cost | Seller manages own upload. |

---

## 📅 Phase 1 — Critical path (revenue + core flow)

> Without these, listings can't be created and payments don't activate boosts. **~6 files.**

### 1.1 `/api/property/create` route
- **File:** `app/api/property/create/route.ts` (new)
- **Action:** POST handler — validates body (Zod), inserts `Property` row, returns `{ id, slug }`. Uses existing `server/property/` helpers.
- **Status:** owner from `await getSession()`; if no session → 401. `status = PENDING_REVIEW`.

### 1.2 ImgBB image-upload proxy
- **File:** `app/api/upload/route.ts` (rewrite existing)
- **Action:** Accept multipart `image` field, POST to `https://api.imgbb.com/1/upload?key=$IMGBB_API_KEY`, return `{ url, delete_url }`. Add `IMGBB_API_KEY` to `.env.example`.
- **Fallback:** if key blank → save to `/public/uploads/` (current behavior).

### 1.3 Wire seller form
- **File:** `components/seller/NewListingForm.tsx` (edit line 92 TODO)
- **Action:** Replace stub with `await fetch('/api/property/create', ...)` after all images uploaded via `/api/upload`. Redirect to `/sell/listings` with success toast.

### 1.4 Payment persistence
- **File:** `app/api/payments/verify/route.ts` (edit lines 24, 51)
- **Action:** On signature-verify success, write `Payment` row + flip the related `Property.boosted = true` (or `featuredUntil = now + 7d`). Schema add: `model Payment` (provider, orderId, signature, amountInr, status, userId, propertyId).

### 1.5 Home page DB switch
- **File:** `app/page.tsx` (edit)
- **Action:** When `process.env.USE_DB === '1'`, call `getNearby(origin, radiusKm)` from `server/property/geo.ts` instead of `MOCK_PROPERTIES`. Keep mock as fallback.

### 1.6 Realtime chat completion
- **Files:** `socket/server.ts` (new/complete), `app/chat/[id]/page.tsx` (wire), `components/chat/ChatBox.tsx` (new if missing)
- **Action:** Socket.io namespace `/chat/:leadId`, rooms keyed by leadId, persist `Message` rows. Server runs alongside Next on VPS via PM2 cluster.
- **Schema add:** `model Message { id, leadId, fromUserId, body, createdAt }`.

---

## 📅 Phase 2 — Buyer dashboard (`/me/*`)

> Pages exist as folders, mostly empty. **~8 files.**

### 2.1 `/me/saved` — favorites CRUD
- **API:** `app/api/favorites/route.ts` (POST add, DELETE remove, GET list)
- **Page:** `app/me/saved/page.tsx` — list of saved cards.
- **Component:** Heart icon on `PropertyCard` toggles via API.

### 2.2 `/me/alerts` — saved searches + email digest
- **API:** `app/api/alerts/route.ts` (CRUD)
- **Cron:** `scripts/cron-alerts.ts` runs daily at 8 AM IST → query new properties matching alert filters → email via Resend/SMTP.
- **Schema add:** `model SavedSearch { id, userId, query (Json), frequency, lastSentAt }`.

### 2.3 `/me/visits` — visit-request log
- **API:** existing `app/api/visit-request/route.ts` extend with GET list for the user.
- **Page:** `app/me/visits/page.tsx` — table of past + upcoming visits.

### 2.4 Property compare
- **Page:** `app/compare/page.tsx` — read `?ids=a,b,c` (max 3), render side-by-side feature table.
- **CTA:** Add "Compare" checkbox on `PropertyCard` + floating bar.

### 2.5 EMI / Home Loan calculator
- **Component:** `components/property/EMICalculator.tsx`
- **Math:** standard EMI formula in pure JS. Inputs: price, down payment %, rate %, tenure years. Outputs: monthly EMI, total interest, schedule chart (Recharts already in deps if available, else SVG sparkline).
- **Embed:** on property detail page below the price block.

---

## 📅 Phase 3 — Trust, verification, fraud

> Buyers won't trust without these. **~6 files.**

### 3.1 Aadhaar / owner verification flow
- **Page:** `app/auth/verify-docs/page.tsx` (enhance) — upload aadhaar front/back + selfie via `/api/upload` (ImgBB), POST to `/api/verifications`.
- **API:** `app/api/verifications/route.ts` (new) — POST creates `Verification` row; GET returns user's status.
- **Admin:** `app/admin/verifications/page.tsx` (new) — list pending, approve/reject buttons → sets `User.aadhaarVerified = now()`.
- **Schema add:** `model Verification { id, userId, aadhaarFrontUrl, aadhaarBackUrl, selfieUrl, status, reviewedBy, reviewedAt }`.

### 3.2 Reviews & ratings
- **Schema add:** `model Review { id, propertyId, userId, rating (1-5), body, createdAt }`.
- **API:** `app/api/reviews/route.ts` (POST/GET by propertyId).
- **UI:** Star rating + comment list on property detail page; aggregate rating shown on card.

### 3.3 Error tracking — GlitchTip self-hosted
- **Deploy:** `deploy/glitchtip.docker-compose.yml` (new) — runs GlitchTip on VPS at `:8001`.
- **App wiring:** `lib/sentry.ts` — `@sentry/nextjs` pointed at GlitchTip DSN. Update `app/error.tsx:17` to call `captureException`.
- **Env add:** `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.

### 3.4 AI fraud flags (already a stub in `/admin/fraud`)
- **Wire:** existing Cloudflare Workers AI describe endpoint → also score images for duplicates (perceptual hash via `sharp`), price anomalies (z-score vs locality median). Surface flags in `/admin/moderation`.

---

## 📅 Phase 4 — India-specific & SEO

> Differentiators for the local market. **~10 files.**

### 4.1 Multilingual UI (hi / en / bn / ta)
- **Lib:** `next-intl`
- **Files:** `messages/en.json`, `messages/hi.json`, etc.
- **Wire:** `app/[locale]/...` or middleware-detected locale. Replace strings in core pages (Hero, Nav, Footer first).
- **Existing toggle:** `components/layout/LanguageToggle.tsx` already saves preference — connect to `next-intl` locale.

### 4.2 Locality insights pages
- **Page:** `app/in/[city]/[locality]/page.tsx` (new)
- **Data fetcher:** `lib/overpass.ts` — Overpass API query for nearby `amenity=school|hospital`, `railway=station`, with 24h cache in Postgres.
- **Sections:** demographics summary (static seed), nearby amenities count, price trends chart (avg of properties in radius).

### 4.3 Builder / Project pages
- **Schema add:** `model Project { id, name, builder, city, locality, geo, startDate, possessionDate, units, ... }`; link `Property.projectId`.
- **Pages:** `app/in/[city]/projects/page.tsx` (list), `app/in/[city]/projects/[slug]/page.tsx` (detail with project-level gallery + unit comparison).

### 4.4 Locality-level sitemap
- **File:** `app/sitemap/page.tsx` + `app/sitemap.xml/route.ts` — add per-locality URLs and per-project URLs.

### 4.5 PWA push notifications
- **Service worker:** `public/sw.js` (new) — registers, handles `push` event.
- **Server:** `lib/push.ts` — `web-push` library, generate VAPID with `npx web-push generate-vapid-keys` and store in `.env`.
- **Triggers:** new lead for seller, price drop on saved property for buyer.

---

## 📅 Phase 5 — Conversion + monetization polish

> Nice-to-have but money-relevant. **~7 files.**

### 5.1 Virtual tour / video
- **Schema:** existing `MediaItem` add `type` enum `IMAGE | VIDEO | TOUR_360 | YOUTUBE`.
- **UI:** `components/property/MediaGallery.tsx` — embed YouTube unlisted, Matterport tour URL (seller pastes link).

### 5.2 "Make an offer" / negotiation flow
- **Schema:** `Lead` model — add `offerAmountInr`, `negotiationStatus`.
- **UI:** Modal on property detail with "Submit Offer" button.

### 5.3 Mortgage / loan partners page
- **Page:** `app/loans/page.tsx` (static initially) — list of bank loan rates (manually curated), EMI calc embed, lead-capture form that pipes to `/api/lead`.

### 5.4 Blog content engine
- **Setup:** `content/blog/*.mdx` with front-matter (title, date, hero).
- **Page:** `app/blog/page.tsx` (rewrite to read MDX), `app/blog/[slug]/page.tsx` (new).
- **Lib:** `next-mdx-remote` (already in Next ecosystem; no API cost).

### 5.5 Lead inbox for sellers (`/sell/leads`)
- **Enhance existing page:** wire to real `Lead` data, add reply/CTA buttons (calls chat via Phase 1.6).

---

## 🧪 Cross-cutting items

- **Indexes:** add Postgres indexes on `Property(city, kind, intent, status)` and a GiST index on `geo` (already in PostGIS).
- **Caching layer:** Redis already in env — add cache wrappers for Nominatim / Overpass results (24h TTL).
- **Seed data:** `prisma/seed.ts` — populate 50 realistic Kolkata + Delhi + Mumbai properties for staging.
- **Tests:** `tests/api/*.test.ts` — at minimum cover property/create, payments/verify, favorites CRUD.
- **CI smoke:** GitHub Actions workflow `pnpm test && pnpm build` on every PR.

---

## 💰 What stays paid-only (NOT in this plan, parked until authorized)

- Twilio SMS (current OTP falls back to console / email).
- Razorpay live mode (using test keys only).
- Mapbox upgrade (sticking to free 50k loads/month + OSM Leaflet fallback).
- DigiLocker Aadhaar API (production access requires KYC partnership) — using manual admin-approval flow instead.
- WhatsApp Business API for alerts (using email only).

---

## ✅ Suggested execution order

1. **Phase 1.1 → 1.5** (one PR) — unblocks revenue.
2. **Phase 1.6** (one PR) — chat + lead loop.
3. **Phase 2** (one PR each: saved → alerts → visits → compare → EMI).
4. **Phase 3.1 + 3.2** together — trust signals.
5. **Phase 3.3** — observability before scaling.
6. **Phase 4** — SEO + India fit, run in parallel where possible.
7. **Phase 5** — close monetization loop.

**Estimated total effort:** ~35–45 files touched across ~6–8 PRs. Iterating one PR at a time keeps reviews tight.

---

## 🔑 Env vars to add (free-tier)

```bash
# ImgBB image hosting (free, signup at imgbb.com/api)
IMGBB_API_KEY=

# Web push (VAPID, self-generate: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:animesh@freedomwithai.com

# GlitchTip (Sentry-compatible self-host)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Toggle DB usage on home page
USE_DB=1
```

---

**Next step:** user picks a phase, I open a PR for it.
