# AapKaPlot — Website Puri Details

## Website Kya Hai?

**AapKaPlot** ek Indian real estate platform hai jahan log plot, flat, house, villa, shop, office, warehouse aur agricultural land khareedd ya kiraye par le sakte hain. Ye Next.js 14 (App Router) par bana hai aur PostgreSQL + PostGIS database use karta hai geolocation ke liye.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Database | PostgreSQL + PostGIS (spatial queries) |
| ORM | Prisma |
| Cache | Redis |
| Auth | Custom OTP (SMS via Twilio ya console), Google OAuth (NextAuth) |
| AI | Anthropic Claude / OpenAI / Cloudflare Workers AI (fallback chain) |
| Image Hosting | ImgBB (free) ya local /public/uploads/ |
| Push Notifications | VAPID Web Push (free) |
| Error Tracking | GlitchTip (self-hosted) |
| Maps | Custom PostGIS geo queries + Haversine formula |
| Payments | Abhi disabled (team manually handle karta hai billing) |
| Deploy | Hostinger VPS, GitHub Actions auto-deploy |

---

## Database Models (Prisma Schema)

### User
```
id, phone (unique), email (unique), name, address
whatsappPhone, role (BUYER/SELLER/AGENT/ADMIN/SUPER_ADMIN)
suspended, passwordHash, phoneVerified, emailVerified, aadhaarVerified
```

### Property
```
id, title, description, kind (plot/flat/house/villa/shop/office/warehouse/agriculture)
intent (BUY/RENT), status (DRAFT/PENDING_REVIEW/ACTIVE/PAUSED/SOLD/REJECTED)
priceInr, previousPriceInr, areaSqft, bhk
locality, city, state, pincode, lat, lng, geom (PostGIS)
boundary (GeoJSON polygon), coverUrl, gallery[], videoUrl, youtubeUrl
tourUrl (360° Matterport), panoFrames[], satelliteUrl
verified, trustScore, amenities[], aiBadges[]
roadEastFt/WestFt/NorthFt/SouthFt (Indian plot-specific Vastu fields)
featuredUntil, boostedUntil, allowsBrokers, brokerCommissionPct
projectId (builder project link)
```

### Baaki Models
- **Lead** — buyer inquiry jo seller ko jaati hai
- **Favorite** — user ki saved properties
- **OtpCode** — phone/email OTP verification
- **Payment** — payment records
- **VisitRequest** — property visit schedule
- **SavedSearch** — user ke saved search alerts
- **Verification** — Aadhaar/document verification
- **Review** — user reviews on sellers
- **PushSubscription** — web push notification tokens
- **BrokerProfile** — broker ka profile
- **BrokerReferral** — broker ne property refer ki
- **Commission** — broker ka commission record
- **PriceHistory** — property price ka history
- **Project** — builder project (multiple units)
- **AdminAuditLog** — admin actions ka log
- **PerformanceScan** — PageSpeed audit results

---

## Pages / Routes

### Public Pages
| Route | Kya Hai |
|---|---|
| `/` | Homepage — Hero, AI Showcase, Featured Properties, Map, YouTube, Testimonials |
| `/search` | Property search with filters |
| `/property/[id]` | Property detail page |
| `/in/[city]` | City-wise listing page (SEO) |
| `/in/[city]/[kind]` | City + property type listing (e.g. /in/bengaluru/plots) |
| `/in/[city]/projects/[slug]` | Builder project detail |
| `/blog/[slug]` | SEO blog articles |
| `/compare` | Side-by-side property comparison |
| `/loans` | Home loan lead form |
| `/pricing` | Plans & pricing |
| `/about`, `/contact`, `/privacy`, `/press`, `/careers` | Static info pages |
| `/ai-technology` | AI features showcase |

### Auth Pages
| Route | Kya Hai |
|---|---|
| `/auth/login` | OTP + Google OAuth login |
| `/auth/signup` | New user registration |
| `/auth/verify` | OTP verification |
| `/auth/verify-docs` | Document (Aadhaar) verification |

### User Dashboard (`/me/`)
| Route | Kya Hai |
|---|---|
| `/me` | User profile overview |
| `/me/settings` | Profile settings form |
| `/me/saved` | Saved/favorited properties |
| `/me/alerts` | Price & search alerts |
| `/me/offers` | Offers sent/received |
| `/me/visits` | Scheduled property visits |
| `/me/recommendations` | AI-recommended properties |

### Seller Dashboard
| Route | Kya Hai |
|---|---|
| `/seller/dashboard` | Seller's overview |
| `/seller/listings` | Seller ki properties |
| `/seller/[id]` | Specific property manage |
| `/seller/new` | Naya listing daalna |

### Broker Panel (`/broker/`)
| Route | Kya Hai |
|---|---|
| `/broker` | Broker dashboard |
| `/broker/signup` | Broker registration |
| `/broker/profile` | Broker profile edit |
| `/broker/marketplace` | Property marketplace for brokers |
| `/broker/referrals` | Refer kiye hue leads |
| `/broker/commissions` | Earned commissions |

### Chat
| Route | Kya Hai |
|---|---|
| `/chat` | All conversations list |
| `/chat/[id]` | Single conversation with buyer/seller |

### Admin Panel (`/admin/`)
| Route | Kya Hai |
|---|---|
| `/admin` | Admin dashboard overview |
| `/admin/properties` | Saari properties manage karo |
| `/admin/properties/edit/[id]` | Property edit |
| `/admin/users` | User management |
| `/admin/moderation` | Content moderation queue |
| `/admin/verifications` | Document verification requests |
| `/admin/fraud` | Fraud detection dashboard |
| `/admin/seo` | SEO article management |
| `/admin/ai-tools` | AI tools panel |
| `/admin/analytics` | Traffic & funnel analytics |
| `/admin/heatmap` | Click heatmap |
| `/admin/visitors` | Live visitors |
| `/admin/events` | Event tracking |
| `/admin/audit` | Admin action audit log |
| `/admin/database/[table]` | Direct database table viewer |
| `/admin/system-log` | Server logs |
| `/admin/performance` | PageSpeed scan |
| `/admin/ads` | Ad slots management |

---

## API Endpoints

### Auth APIs
- `POST /api/auth/otp/send` — OTP bhejo phone/email pe
- `POST /api/auth/otp/verify` — OTP verify karo, session cookie set karo
- `GET/POST /api/auth/[...nextauth]` — Google OAuth (NextAuth)
- `GET /api/auth/me` — Current logged-in user info
- `POST /api/auth/logout` — Session clear karo
- `GET /api/auth/oauth-bridge` — OAuth redirect bridge

### Property APIs
- `POST /api/property/create` — Naya property listing
- `GET /api/property/[id]/price-history` — Price history
- `GET /api/property/nearby` — Nearby properties (PostGIS)
- `GET/PUT /api/seller/property/[id]` — Seller apni property manage kare
- `GET /api/seller/properties` — Seller ki saari properties
- `GET /api/seller/leads` — Seller ke leads

### Lead / Inquiry APIs
- `POST /api/lead` — Buyer inquiry bhejo
- `POST /api/lead/offer` — Offer send karo
- `POST /api/lead/offer/action` — Offer accept/reject
- `GET /api/lead/reveal` — Seller ka number reveal (lead unlock)
- `GET /api/me/offers` — Meri offers

### AI APIs
- `POST /api/ai/describe` — Property description generate karo (OpenAI → Cloudflare Workers AI fallback)
- `POST /api/ai/title` — Property title generate
- `POST /api/ai/valuation` — AI valuation estimate
- `POST /api/ai/recommendations` — Personalized property recommendations
- `POST /api/ai/chat` — Chinkki AI chatbot (Hinglish behen-jaisi)
- `POST /api/ai/grahak-match` — Buyer-seller AI matching
- `POST /api/ai/email-draft` — Email draft generate
- `POST /api/ai/marketing-copy` — Marketing copy likhna

### Admin APIs
- `GET/POST /api/admin/properties` — Properties manage
- `PUT/DELETE /api/admin/properties/[id]` — Specific property
- `POST /api/admin/decision` — Approve/reject listings
- `GET/POST /api/admin/users` — User management
- `PUT/DELETE /api/admin/users/[id]` — Specific user (suspend/delete)
- `GET /api/admin/verifications` — Document verification queue
- `GET /api/admin/fraud` — Fraud signals
- `POST /api/admin/moderation` — Content moderate
- `GET /api/admin/visitors` — Live visitor data
- `GET /api/admin/system-log` — Server logs
- `POST /api/admin/performance/scan` — PageSpeed scan trigger

### SEO Admin APIs (bahut sara)
- `/api/admin/seo/generate` — AI se SEO articles generate karo
- `/api/admin/seo/generate-trending` — Trending topics pe articles
- `/api/admin/seo/[id]/publish` — Article publish
- `/api/admin/seo/[id]/improve` — AI se improve
- `/api/admin/seo/[id]/rebuild` — Rebuild article
- `/api/admin/seo/rerank` — Quality score se rerank
- `/api/admin/seo/gsc-sync` — Google Search Console sync
- `/api/admin/seo/clean-bad-slugs` — Bad URLs clean
- `/api/admin/seo/rebuild-all` — Saare articles rebuild
- `/api/admin/seo/delete-below` — Low quality delete

### Cron Job APIs (auto-scheduled)
- `GET /api/cron/auto-match-daily` — Roz 08:00 IST: pichle 24h ke inquiries ke liye AI shortlist banao, admin ko digest email bhejo WhatsApp deep-links ke saath
- `GET /api/cron/auto-followup` — 3-din baad buyers ko AI-drafted follow-up
- `GET /api/cron/seo-generate` — Auto SEO articles generate

### Other APIs
- `POST /api/upload` — Image upload (ImgBB ya local)
- `POST /api/alerts` — Price alert set karo
- `POST /api/visit-request` — Property visit schedule
- `POST /api/reviews` — Review likhna
- `POST /api/verifications` — Document verification submit
- `POST /api/push/subscribe` — Web push notification subscribe
- `GET /api/track/visit` — Page visit track (analytics)

---

## Authentication Flow

1. **OTP Login**: User phone/email deta hai → `/api/auth/otp/send` OTP bhejta hai (Twilio SMS ya console log) → User OTP daalta hai → `/api/auth/otp/verify` verify karta hai → `akp_session` cookie set hoti hai (HMAC-signed JWT)
2. **Google OAuth**: NextAuth handle karta hai → `/api/auth/oauth-bridge` se bridge → same session cookie
3. **Middleware**: Har `/admin/*` route pe Edge middleware check karta hai ki `akp_session` cookie hai ya nahi → nahi hai to `/auth/login` pe redirect
4. **Role Check**: Admin layout.tsx mein full server-side role verification hoti hai (`ADMIN` ya `SUPER_ADMIN` role chahiye)

---

## AI Features (Chinkki)

AI chatbot ka naam **Chinkki** (double K) hai — ek behen-jaisi, Hindi+Urdu Hinglish mein baat karne wali marketing-savvy AI assistant.

### AI Fallback Chain
```
OpenAI GPT (agar key hai)
    ↓ fail hone par
Cloudflare Workers AI (free 100k req/day)
    ↓ fail hone par
Anthropic Claude / Groq / Gemini / Mistral (env var se jo bhi set ho)
```

### AI Kya Karta Hai
- **Property Description Generate** — seller ke fields se human-readable description
- **Title Suggest** — catchy SEO-friendly title
- **Valuation Estimate** — locality + size se price estimate
- **Grahak Match** — buyer requirements se best matching properties
- **Auto-Reply Draft** — inquiry aane par seller ki taraf se draft reply
- **Daily Digest** — roz admin ko email: nayi inquiries + AI-shortlisted properties + WhatsApp links
- **SEO Articles** — blog articles AI se generate (max 100/day, 800+ words, human style)
- **Marketing Copy** — social media/ad copy

---

## Broker System

- Broker signup karta hai `/broker/signup` se
- Property pe `allowsBrokers: true` hota hai
- Broker buyer refer karta hai → `BrokerReferral` record banta hai
- Deal close hone par `Commission` record banta hai
- Broker apna commission track kar sakta hai `/broker/commissions` se
- Commission percentage per-listing override ho sakta hai ya broker ka default use hota hai

---

## SEO System

- **6 Templates**: City page, kind page, project page, blog article, locality guide, comparison
- **Quality Gate**: Min score chahiye publish hone ke liye
- **IndexNow**: Naya page publish hone par search engines ko instant ping
- **Internal Links**: Auto-generated anchor links between related pages
- **Keyword Bank**: City + property type combinations ka bank
- **GSC Sync**: Google Search Console se impressions/clicks sync
- **Structured Data (JSON-LD)**: Organization, WebSite, BreadcrumbList, Product schemas
- **Canonical URLs**: Har page pe canonical set hai duplicate content rokne ke liye

---

## Fraud Detection

- `/server/property/fraud.ts` — suspicious listing signals detect karta hai
- Admin `/admin/fraud` dashboard pe flagged listings dikhti hain
- Trust Score property pe stored hota hai (0-100)
- `aiBadges` array — AI-verified quality signals

---

## Homepage Components (Render Order)

1. **Navbar** — navigation, location chip, user menu
2. **Hero** — headline + search bar + CTAs
3. **AiAssistantShowcase** — Chinkki ka feature highlight
4. **TopPicksStrip** — Latest / Sponsored / Best Deals rails
5. **NearbyRail** — GPS se nearest properties
6. **CategoryGrid** — Quick filter: Plots, Flats, Houses, Villas etc.
7. **WhyChooseSection** — USP bullets
8. **MapLocationSection** — Interactive map
9. **AIRecommendations** — AI-picked carousel
10. **YouTubeRail** — Channel ke latest videos (free RSS, no API key)
11. **TestimonialsSection** — Customer reviews
12. **LeadCaptureSection** — Inquiry form
13. **HomepageAdSlot** — Sponsored partners
14. **Footer** — Links, newsletter, social
15. **StickyWhatsApp** — Floating WhatsApp button (har page pe)
16. **FloatingChatBot** — Chinkki AI chat widget (har page pe)

---

## Key Business Logic

| Feature | Logic |
|---|---|
| Property listing | Seller submit karta hai → PENDING_REVIEW → Admin approve/reject → ACTIVE |
| Nearby search | PostGIS ST_DistanceSphere query, Haversine fallback |
| Mock mode | `USE_DB=` blank ho to mock catalogue use hota hai (demo ke liye) |
| Lead reveal | Buyer seller ka number tab dekh sakta hai jab lead submit kare |
| Price history | Har price change pe `PriceHistory` record banta hai |
| Featured/Boosted | `featuredUntil` / `boostedUntil` datetime se expiry hoti hai |
| SuperAdmin | `SUPER_ADMIN_EMAILS` env var mein jo emails hain, pehli baar login pe auto-promote |
| Web Push | VAPID keys se free browser push notifications |
| Image upload | ImgBB free tier → fail hone par `/public/uploads/[uid]/` mein save |

---

## Environment Variables (Key Ones)

```
NEXT_PUBLIC_SITE_URL     — Website URL
USE_DB                   — 1 = real DB, blank = mock data
DATABASE_URL             — PostgreSQL connection string
REDIS_URL                — Redis cache
OTP_TWILIO_SID/TOKEN     — SMS OTP (blank = console log)
NEXTAUTH_SECRET          — OAuth session secret
GOOGLE_CLIENT_ID/SECRET  — Google OAuth
IMGBB_API_KEY            — Image hosting (blank = local storage)
ANTHROPIC_API_KEY        — Claude AI (blank = Cloudflare Workers AI)
CRON_SECRET              — Cron job auth key
SUPER_ADMIN_EMAILS       — Comma-separated admin emails
NEXT_PUBLIC_VAPID_PUBLIC — Web push key
GOOGLE_SITE_VERIFICATION — GSC verification
ADSENSE_PUBLISHER_ID     — Google AdSense (ca-pub-XXXX)
ADMIN_NOTIFY_EMAIL       — Admin digest email (default: animesh@freedomwithai.com)
```

---

## Deployment

- **VPS**: Hostinger (vidyt.com ke saath shared — unke files kabhi touch mat karo)
- **Auto Deploy**: GitHub Actions → webhook fire → VPS pe `git pull` + `npm run build`
- **Webhook Token**: `.env.local` mein `DEPLOY_WEBHOOK_TOKEN` match hona chahiye
- **Build**: `next build` → `.next/` folder

---

*File generated: 2026-05-22*
