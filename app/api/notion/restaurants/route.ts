// app/api/notion/restaurants/route.ts
import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { Restaurant } from '../../../../lib/types'

/** Match your Notion schema */
const PROP = {
  title:   ['Name'],
  link:    ['link', 'Link', 'Website', 'URL', 'url', 'tiktok'],
  day:     ['Day'],
  time:    ['Time'],               // date
  price:   ['price', 'Price'],
  deposit: ['Deposit'],
  location:['Location'],           // ← text/rich_text
  rank:    ['rank', 'Rating', 'Stars'],
  menu:    ['menu', 'Menu'],       // files or url
  zone:    ['Zone'],
  distance:['Distance'],
  cuisine: ['Cuisine'],
  meal:    ['Meal'],
  area:    ['Area'],               // may be select or text
  tiktok:  ['TikTok', 'tiktok'],
} as const

export async function GET(req: Request) {
  const key  = process.env.NOTION_API_KEY
  const dbId = process.env.NOTION_FOOD_DB_ID
  if (!key || !dbId) {
    return NextResponse.json(
      { error: 'Missing NOTION_API_KEY or NOTION_FOOD_DB_ID' },
      { status: 400 }
    )
  }

  const notion = new Client({ auth: key })

  // Query params to help us filter “near”
  const { searchParams } = new URL(req.url)
  const near = (searchParams.get('near') || '').trim().toLowerCase()
  const area = (searchParams.get('area') || '').trim().toLowerCase()
  const dayLabel = (searchParams.get('day') || '').trim()
  const locHint = (searchParams.get('location') || '').trim().toLowerCase()

  // Priority needle: Location > Area > Near (free-text)
  const locationNeedle = locHint || area || near

  try {
    // Retrieve DB schema (so we can safely build type-correct filters)
    const db = await notion.databases.retrieve({ database_id: dbId })

    const filter = buildFilterWithPrecedence(db, {
      locationNeedle,
      area,
      dayLabel,
    })

    const pages: any[] = []
    let cursor: string | undefined
    do {
      const res = await notion.databases.query({
        database_id: dbId,
        page_size: 50,
        start_cursor: cursor,
        filter,
        sorts: [
          // Safe to attempt; Notion ignores if property missing, but we'll leave as-is.
          { property: 'Distance', direction: 'ascending' } as any,
          { property: 'rank', direction: 'descending' } as any,
        ],
      } as any)
      pages.push(...res.results)
      cursor = res.has_more ? res.next_cursor! : undefined
    } while (cursor)
      

    const out: Restaurant[] = pages.map((page: any) => {
      const props = page.properties

      const { start, end } = getDateRange(props, PROP.time)
      const timeDisplay = getTimeDisplay(start)

      const link = getUrl(props, PROP.link)
      const maybeTikTok =
        getUrl(props, PROP.tiktok) ||
        (link && isTikTok(link) ? link : undefined)

      const menuFiles = getFiles(props, PROP.menu)

      return {
        name: getTitle(props, PROP.title) ?? '(untitled)',
        link: link ?? undefined,
        tiktokUrl: maybeTikTok ?? undefined,
        startTimeISO: start, endTimeISO: end, timeDisplay,
        price: getNumber(props, PROP.price) ?? getText(props, PROP.price),
        deposit: getNumber(props, PROP.deposit) ?? getText(props, PROP.deposit),
        location: getText(props, PROP.location),
        rank: getNumber(props, PROP.rank),
        zone: getSelectName(props, PROP.zone) ?? getText(props, PROP.zone),
        distance: getNumber(props, PROP.distance),
        cuisine: getSelectName(props, PROP.cuisine) ?? getText(props, PROP.cuisine),
        meal: getSelectName(props, PROP.meal) ?? getText(props, PROP.meal),
        area: getSelectName(props, PROP.area) ?? getText(props, PROP.area),
        menuFiles,
      }
    })

    

    // Optional client-side refinement (kept): free-text "near" in multiple fields
    // const refined = out.filter(r => {
    //   if (!near) return true
    //   const hay = [
    //     r.location, r.zone, r.area, r.cuisine, r.meal, r.name
    //   ].filter(Boolean).join(' ').toLowerCase()
    //   return hay.includes(near)
    // })

    return NextResponse.json({ restaurants: out })
  } catch (e: any) {
    const msg = e?.body?.message || e?.message || 'Notion API error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/* ---------------- Filter construction (type-safe) ---------------- */

function buildFilterWithPrecedence(
  db: any,
  {
    locationNeedle,
    area,
    dayLabel,
  }: { locationNeedle?: string; area?: string; dayLabel?: string }
) {
  // 1) Location (text) → rich_text.contains
  if (locationNeedle) {
  const prop = db.properties?.Location
  if (prop && isTextLike(prop)) {
    const words = locationNeedle
      .split(/\s+/) // split on spaces
      .map(w => w.trim())
      .filter(Boolean)

    // Build OR conditions: any word contained in Location
    const orFilters = words.map(w => ({
      property: 'Location',
      rich_text: { contains: w }
    }))

    return { or: orFilters }
  }
}

  // 2) Area fallback:
  if (area) {
    const prop = db.properties?.Area
    if (prop) {
      // If select: emulate "contains" by OR of equals for matching options
      if (prop.type === 'select') {
        const needle = area.toLowerCase()
        const options: Array<{ name: string }> = prop.select?.options ?? []
        const matches = options.filter(o => o.name?.toLowerCase().includes(needle))
        if (matches.length) {
          return { or: matches.map(m => ({ property: 'Area', select: { equals: m.name } })) }
        }
      }
      // If text-like: rich_text.contains
      if (isTextLike(prop)) {
        return { and: [{ property: 'Area', rich_text: { contains: area } }] }
      }
    }
  }

  // 3) Day fallback (exact):
  if (dayLabel) {
    const prop = db.properties?.Day
    if (prop) {
      if (prop.type === 'select') {
        return { and: [{ property: 'Day', select: { equals: dayLabel } }] }
      }
      if (isTextLike(prop)) {
        return { and: [{ property: 'Day', rich_text: { equals: dayLabel } }] }
      }
    }
  }

  // No server-side filter
  return undefined
}

function isTextLike(prop: any) {
  return prop.type === 'rich_text' || prop.type === 'title'
}

/* ---------------- Notion property readers ---------------- */

function getTitle(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]; if (p?.type === 'title') {
      const t = (p.title || []).map((r:any)=> r.plain_text || r.text?.content).filter(Boolean).join('')
      if (t) return t
    }
  }
  return null
}

function getText(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]; if (!p) continue
    if (p.type === 'rich_text') {
      const t = (p.rich_text||[]).map((r:any)=> r.plain_text || r.text?.content).filter(Boolean).join('')
      if (t) return t
    }
    if (p.type === 'url' && p.url) return p.url
    if (p.type === 'select' && p.select?.name) return p.select.name
    if (p.type === 'multi_select' && p.multi_select?.length) {
      const t = p.multi_select.map((s:any)=>s.name).filter(Boolean).join(', ')
      if (t) return t
    }
    if (p.type === 'title') {
      const t = (p.title||[]).map((r:any)=> r.plain_text || r.text?.content).filter(Boolean).join('')
      if (t) return t
    }
  }
  return null
}

function getSelectName(props:any, names:readonly string[]){
  for(const n of names){ const p = props[n]; if(p?.type==='select' && p.select?.name) return p.select.name }
  return null
}

function getNumber(props:any, names:readonly string[]){
  for(const n of names){
    const p = props[n]
    if(p?.type==='number') return p.number as number
    if(p?.type==='rich_text'){
      const v = (p.rich_text||[]).map((r:any)=> r.plain_text || r.text?.content).join('')
      const num = Number(v); if(!Number.isNaN(num)) return num
    }
  }
  return null
}

function getUrl(props:any, names:readonly string[]){
  for(const n of names){ const p = props[n]; if(p?.type==='url' && p.url) return p.url as string }
  return null
}

function getFiles(props:any, names:readonly string[]){
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'files' && Array.isArray(p.files) && p.files.length) {
      return p.files.map((f:any)=> ({
        url: f?.type === 'file' ? f.file?.url : f?.external?.url,
        name: f.name
      })).filter((x:any)=> !!x.url)
    }
  }
  return []
}

function getDateRange(props:any, names:readonly string[]){
  for(const n of names){ const p = props[n]; if(p?.type==='date' && p.date?.start){
    return { start: p.date.start as string, end: (p.date.end as string) ?? null }
  }}
  return { start: null, end: null }
}

function getTimeDisplay(startISO:string|null){
  if(!startISO) return null
  try{
    const d = new Date(startISO); const hh = String(d.getHours()).padStart(2,'0'); const mm = String(d.getMinutes()).padStart(2,'0')
    return `${hh}:${mm}`
  }catch{ return null }
}

function isTikTok(url:string){
  return /tiktok\.com/i.test(url)
}