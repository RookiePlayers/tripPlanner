import { NextResponse } from 'next/server'

const UNSPLASH = 'https://api.unsplash.com/search/photos'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || 'Bali'
  const orientation = searchParams.get('orientation') || 'landscape'
  const perPage = 1

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    return NextResponse.json({ error: 'Missing UNSPLASH_ACCESS_KEY' }, { status: 400 })
  }

  const url = `${UNSPLASH}?query=${encodeURIComponent(q)}&per_page=${perPage}&orientation=${orientation}`
  const r = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
    // cache softly for a bit to avoid hammering the API
    next: { revalidate: 60 },
  })
  if (!r.ok) {
    const msg = await r.text().catch(()=> 'Unsplash error')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
  const json = await r.json()

  const photo = json?.results?.[0]
  if (!photo) return NextResponse.json({ image: null })

  const credit = {
    authorName: photo.user?.name,
    authorLink: (photo.user?.links?.html || photo.user?.portfolio_url || '#') +
      '?utm_source=tripPlanner&utm_medium=referral',
    unsplashLink: (photo.links?.html || 'https://unsplash.com') +
      '?utm_source=tripPlanner&utm_medium=referral',
  }

  return NextResponse.json({
    image: {
      id: photo.id,
      alt: photo.alt_description || q,
      urls: {
        thumb: photo.urls?.thumb,
        small: photo.urls?.small,
        regular: photo.urls?.regular,
        full: photo.urls?.full,
      },
      credit,
    }
  }, {
    headers: {
      // CDN/proxy friendly caching
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  })
}