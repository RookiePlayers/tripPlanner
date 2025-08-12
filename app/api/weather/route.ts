import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Missing OPENWEATHER_API_KEY' }, { status: 400 })

  const city = url.searchParams.get('city')
  const lat = url.searchParams.get('lat') || '-8.4095'
  const lon = url.searchParams.get('lon') || '115.1889'

  const endpoint = city
    ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
    : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`

  const r = await fetch(endpoint)
  const data = await r.json()
  return NextResponse.json(data)
}
