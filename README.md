# Bali Travel Companion

Interactive, animated, mobile-first travel web app for your Bali 2025 trip (Next.js + Tailwind).

## Quick Start

```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local
pnpm dev # open http://localhost:3000
```

## Environment

- `OPENWEATHER_API_KEY` – from OpenWeather (free tier ok).

Optional (for live Notion sync – not implemented in this scaffold):
- `NOTION_API_KEY`
- `NOTION_ACTIVITIES_DB_ID`
- `NOTION_FOOD_DB_ID`

## Data

Replace these with exports from your Notion **Activities** and **Food** tables (or keep the samples):
- `/public/data/activities.json`
- `/public/data/food.json`

Schemas are under `/lib/types.ts`. Samples under `/data/*.sample.json`.

## Pages

- `/` Welcome (dual clocks for Bali/UK, weather, quick links, emergency numbers, hotel card)
- `/flights` Flight timeline (pre-filled with your flights)
- `/tickets` Ticket Viewer carousel (PDF viewer with download)
- `/visa` Visa viewer links
- `/accommodation` Villa overview, amenities, nearby vendors, virtual waiter
- `/activities` Tabs per Day → agenda cards (status, price, maps, ticket/TikTok links)
- `/payments` Payment tracker (activities unpaid + food excluding days 2 & 5)

## Customisation

- Update `/lib/utils.ts` for hotel/home addresses & flights.
- Put your PDFs into `/public/docs` (already included: flight tickets, dinner ticket if provided).
- Replace hero images in `/public/images`.

## Notes

- Gate/boarding time is best-effort (update close to departure).
- Activity "birthday" styling and Day 7 special highlights are handled in the Activities page (adjust logic as needed).
