import { NextResponse } from "next/server";
import { LRU } from "../../../lib/utils";

const jsonCache = new LRU<any>(600, 1000 * 60 * 60 * 24 * 7); // 7d
const KEY = (name: string, loc: string) => `gp:json:${name.toLowerCase().trim()}|${loc.toLowerCase().trim()}`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const location = searchParams.get("location") || "";
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!name || !apiKey) {
    return NextResponse.json({ error: "Missing name or API key" }, { status: 400 });
  }

  const cacheKey = KEY(name, location);
  const cached = jsonCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } // CDN 1d
    });
  }

  try {
    // 1) Text search
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${name} ${location}`)}&key=${apiKey}`
    );
    const searchData = await searchRes.json();

    if (!searchData.results?.length) {
      const resp = { photoUrl: null, place: null };
      jsonCache.set(cacheKey, resp);
      return NextResponse.json(resp, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }
      });
    }

    const place = searchData.results[0];

    // 2) Details
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,photos,rating,formatted_address,url&key=${apiKey}`
    );
    const detailsData = await detailsRes.json();
    const photoRef = detailsData.result?.photos?.[0]?.photo_reference;

    // We return our own proxied photo URL (so the image fetch also gets cached server-side)
    const photoUrl = photoRef ? `/api/google-places/photo?ref=${encodeURIComponent(photoRef)}` : null;

    const payload = {
      photoUrl,
      place: {
        name: detailsData.result?.name ?? place.name,
        address: detailsData.result?.formatted_address ?? place.formatted_address,
        rating: detailsData.result?.rating ?? place.rating,
        mapsUrl: detailsData.result?.url
      }
    };

    jsonCache.set(cacheKey, payload);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Google Places error" }, { status: 500 });
  }
}