# AapKaPlot

India's AI-powered real estate platform — nearby plots, flats, houses, commercial & agricultural land with live maps, satellite view, and verified owners.

## Stack

- **Frontend**: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · Lucide
- **Backend**: Next.js Route Handlers · Prisma · PostgreSQL + PostGIS · Redis
- **Maps**: Mapbox GL · static-tile fallback
- **Realtime**: socket.io (chat / lead notifications)
- **Auth**: OTP (phone/email) · JWT · OAuth-ready

## Folder layout

```
app/                Next.js routes, layouts, and API route handlers
  api/property/nearby/route.ts   Example: PostGIS-backed nearby search
components/
  layout/           Navbar, Footer, Logo, Container
  home/             Hero, SearchPanel, MapPreview, NearbyRail, CategoryGrid, AIRecommendations
  property/         PropertyCard
  ui/               Button, Badge, GlassCard (design-system primitives)
lib/                utils, types, format, haversine, mock-data
server/             db, auth (OTP), property (PostGIS), user
ai/                 Recommendation ranker
maps/               Mapbox config + static-tile helpers
prisma/             schema.prisma (PostGIS-aware)
socket/             socket.io server stub
public/             Static assets
```

## Getting started

```bash
cp .env.example .env
npm install

# Spin up Postgres + PostGIS locally
docker run --name pg -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgis/postgis:16-3.4

npx prisma db push
npm run dev
```

Then open `http://localhost:3000`.

> Without `NEXT_PUBLIC_MAPBOX_TOKEN`, the hero map falls back to a styled CSS preview. Set the token to see a real tile.

## Nearby search (PostGIS)

We use `ST_DistanceSphere` with a GIST index on `Property.geom`. See [`server/property/geo.ts`](./server/property/geo.ts) and the example route [`app/api/property/nearby/route.ts`](./app/api/property/nearby/route.ts).

After the first `prisma db push`, run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
UPDATE "Property"
  SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
CREATE INDEX IF NOT EXISTS property_geom_idx
  ON "Property" USING GIST (geom);
```

## Design system

- **Light mode only**, white surface, emerald/sky accents, soft shadows, glassmorphism cards.
- Typography: Plus Jakarta Sans (display) + Inter (body).
- Tokens live in `tailwind.config.ts` (`brand`, `ink`, `accent`, `surface`).

## Roadmap (next phases)

- [ ] Property detail page with full image gallery + map + nearby
- [ ] Search results page with filters + map split-view
- [ ] Seller dashboard (upload, leads, analytics)
- [ ] Buyer dashboard (saved, alerts, AI picks)
- [ ] OTP login flow + JWT session
- [ ] Realtime chat via socket.io
- [ ] Admin moderation panel
- [ ] AI fraud detection (image / pricing anomalies)
