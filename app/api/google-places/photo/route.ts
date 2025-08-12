import { NextResponse } from "next/server";
import { LRU } from "../../../../lib/utils";
const photoCache = new LRU<ArrayBuffer>(400, 1000 * 60 * 60 * 24 * 30); // 30d

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!ref || !apiKey) return new Response("Missing ref or API key", { status: 400 });

  const key = `gp:photo:${ref}`;

  const cached = photoCache.get(key);
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=2592000, immutable"
      }
    });
  }

  const upstream = await fetch(
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1280&photoreference=${encodeURIComponent(ref)}&key=${apiKey}`,
    { redirect: "follow" }
  );
  if (!upstream.ok) return new Response("Failed to fetch photo", { status: 502 });

  const ab = await upstream.arrayBuffer();        // <-- ArrayBuffer
  photoCache.set(key, ab);

  return new Response(ab, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=2592000, immutable"
    }
  });
}