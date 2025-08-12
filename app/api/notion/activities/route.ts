// app/api/notion/activities/route.ts
import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import type { DayData, ActivityItem, ActivitiesData } from '../../../../types'

const PROP = {
  title:   ['Name', 'Activity', 'Title'],
  day:     ['Day', 'Day Number', 'day'],     // optional label; NOT used for ordering anymore
  time:    ['Time', 'time'],                 // Notion "date" (start & optional end)
  zone:    ['Zone', 'Area', 'zone'],
  category:['Category', 'Type', 'category'],
  booked:  ['Booked', 'booked', 'BOOKED'],
  paid:    ['Paid', 'paid', 'PAID'],
  price:   ['Price', 'Cost', 'Amount','price'],
  location:['Location', 'Address', 'Place'],
  ticket:  ['Ticket', 'QR', 'Pass'],
  tiktok:  ['TikTok', 'Tiktok', 'Video'],
  header:  ['Header Image', 'Header', 'Image'],
  selectCol: ['Select'],
} as const

// -------- Trip anchoring --------
// You can override these with env vars if needed.
const DEFAULT_TRIP_START = '2025-08-20' // Day 1
const DEFAULT_TRIP_END   = '2025-08-29' // Day 10

export async function GET() {
  const key  = process.env.NOTION_API_KEY
  const dbId = process.env.NOTION_ACTIVITIES_DB_ID
  if (!key || !dbId) {
    return NextResponse.json({ error: 'Missing NOTION_API_KEY or NOTION_ACTIVITIES_DB_ID' }, { status: 400 })
  }

  const notion = new Client({ auth: key })

  try {
    // 1) Query pages
    const pages: any[] = []
    let cursor: string | undefined
    do {
      const res = await notion.databases.query({
        database_id: dbId,
        page_size: 50,
        start_cursor: cursor,
        filter: {
          and: [
            { property: 'Select', select: { does_not_equal: 'Hell Naw' ,} },
          ],
        },
      } as any)
      pages.push(...res.results)
      cursor = res.has_more ? res.next_cursor! : undefined
    } while (cursor)

    // 2) Normalize each row
    type Temp = {
      // date anchor
      dateISO: string | null         // yyyy-mm-dd from Time.start
      // optional display label from "Day"
      dayLabel: string | null
      // day header image candidate
      headerImage?: string | null
      // item payload (with start/end)
      item: ActivityItem & {
        startTimeISO?: string | null
        endTimeISO?: string | null
        startTimeDisplay?: string | null
        endTimeDisplay?: string | null
      }
    }

    const temps: Temp[] = []

    for (const page of pages) {
      if (!('properties' in page)) continue
      const props: any = page.properties

      // Time -> start/end
      const { start, end } = getDateRange(props, PROP.time)
      const { dateOnly: startDateOnly, timeDisplay: startDisplay } = splitDateTime(start)
      const { timeDisplay: endDisplay } = splitDateTime(end)

      // Optional "Day" label for display (NOT used for ordering anymore)
      const dayLabel = getText(props, PROP.day) || getSelectName(props, PROP.day) || null

      // Header image candidate
      const headerImage = getFirstFileUrl(props, PROP.header) ?? null

      const fileRef = getFirstFileRef(props, PROP.ticket) ?? null
      const ticketUrl =
        fileRef
          ? `/api/notion/file?pageId=${page.id}&prop=${encodeURIComponent(fileRef.propName)}&i=${fileRef.index}`
          : (getUrl(props, PROP.ticket) ?? undefined)

      const item: ActivityItem & {
        startTimeISO?: string | null
        endTimeISO?: string | null
        startTimeDisplay?: string | null
        endTimeDisplay?: string | null
      } = {
        name: getTitle(props, PROP.title) ?? '(untitled)',
        startTimeISO: start || undefined,
        endTimeISO: end || undefined,
        startTimeDisplay: startDisplay || undefined,
        endTimeDisplay: endDisplay || undefined,
        zone: getText(props, PROP.zone) ?? undefined,
        category: getSelectName(props, PROP.category) ?? undefined,
        booked: getCheckbox(props, PROP.booked) ?? false,
        paid: getCheckbox(props, PROP.paid) ?? false,
        price: getPrice(props, PROP.price) ?? undefined,
        location: getText(props, PROP.location) ?? getUrl(props, PROP.location) ?? undefined,
        ticketUrl,
        tiktokUrl: getUrl(props, PROP.tiktok) ?? undefined,
      }

      // Only keep rows that have a date anchor; loose rows (no Time.start) are ignored.
      if (startDateOnly) {
        temps.push({ dateISO: startDateOnly, dayLabel, headerImage, item })
      }
    }

    // 3) Build a map keyed by yyyy-mm-dd
    type DateBucket = {
      dateISO: string
      dayLabel?: string | null
      headerImage?: string | null
      items: Temp['item'][]
    }
    const byDate = new Map<string, DateBucket>()
    for (const t of temps) {
      const key = t.dateISO!
      if (!byDate.has(key)) {
        byDate.set(key, {
          dateISO: key,
          dayLabel: t.dayLabel ?? null,
          headerImage: t.headerImage ?? null,
          items: [],
        })
      }
      const b = byDate.get(key)!
      // prefer first non-empty values
      if (!b.dayLabel && t.dayLabel) b.dayLabel = t.dayLabel
      if (!b.headerImage && t.headerImage) b.headerImage = t.headerImage
      b.items.push(t.item)
    }

    // 4) Create continuous days from trip start -> end (inclusive)
    const tripStart = (process.env.TRIP_START_DATE || DEFAULT_TRIP_START).slice(0, 10)
    const tripEnd   = (process.env.TRIP_END_DATE   || DEFAULT_TRIP_END).slice(0, 10)

    const datesInRange = enumerateDates(tripStart, tripEnd) // array of yyyy-mm-dd

    const days: DayData[] = datesInRange.map((dateISO, idx) => {
      const bucket = byDate.get(dateISO)
      const items = (bucket?.items || []).sort((a, b) =>
        (a.startTimeISO || '').localeCompare(b.startTimeISO || '')
      )

      // If this is Day 1 and no activities -> add "Free day / Arrival"
      if (idx === 0 && items.length === 0) {
        items.push({
          name: 'Free day / Arrival',
          startTimeDisplay: '—',
          endTimeDisplay: undefined,
          booked: true,
          paid: true,
          zone: 'Seminyak',
        } as any)
      }

      return {
        dayNumber: idx + 1,
        // keep a display label if one existed in Notion for this date; else synthesize like "Aug 22"
        // @ts-ignore (expose friendly label)
        dayLabel: bucket?.dayLabel || prettyShortDate(dateISO),
        dateISO,
        headerImage: bucket?.headerImage || null,
        items,
      }
    })

    // ---- Post-process special cases ----

    // 1) Force the last day to be a free/rest day
    const lastDay = days.at(-1)
    if (lastDay && lastDay.dateISO) {
      lastDay.items = [
        {
          name: 'Free day / Rest',
          startTimeDisplay: '—',
          booked: true,
          paid: true,
          zone: '—',
        } as any,
      ]
    }

    // 2) Ensure Day 7 (26th) has the two special activities
   // 2) Conditionally reveal Day 7 specials (night before at 18:00 local)
const day7 = days.find((d) => d.dateISO === '2025-08-26' || d.dayNumber === 7)
if (day7) {
  // Configurable reveal time
  const TZ_OFFSET = process.env.SPECIAL_REVEAL_TZ_OFFSET || '+08:00'   // Bali (WITA)
  const REVEAL_HOUR = Number(process.env.SPECIAL_REVEAL_HOUR_LOCAL || 18) // 18:00

  // Compute "night before at REVEAL_HOUR" in local offset -> to epoch
  // Example: if day7 = 2025-08-26, reveal = 2025-08-25T18:00:00+08:00
  const revealBase = new Date(`${day7.dateISO}T${String(REVEAL_HOUR).padStart(2,'0')}:00:00${TZ_OFFSET}`)
  const revealEpoch = new Date(revealBase.getTime() - 24 * 60 * 60 * 1000).getTime()
  const nowEpoch = Date.now()

  const shouldReveal = nowEpoch >= revealEpoch

  if (shouldReveal) {
    const hasMaya = day7.items.some((i: any) =>
      (i.name || '').toLowerCase().includes('maya hotel ubud')
    )
    const hasCandle = day7.items.some((i: any) =>
      (i.name || '').toLowerCase().includes('candlelight')
    )

    if (!hasMaya) {
      day7.items.push({
        name: 'Stay at Maya Hotel Ubud',
        booked: true,
        paid: true,
        zone: 'Zone 2',
        location: 'F7PH+V38 Peliatan, Gianyar Regency, Bali, Indonesia',
        startTimeDisplay: '15:00',
        startTimeISO: day7.dateISO ? `${day7.dateISO}T15:00:00` : undefined,
      } as any)
    }

    if (!hasCandle) {
      day7.items.push({
        name: 'Candlelight dinner',
        booked: true,
        paid: true,
        zone: 'Zone 2',
        location: 'G73G+Q88 Petulu, Gianyar Regency, Bali, Indonesia',
        startTimeDisplay: '19:30',
        startTimeISO: day7.dateISO ? `${day7.dateISO}T19:30:00` : undefined,
      } as any)
    }

    // Keep Day 7 ordered by start time
    day7.items.sort(
      (a: any, b: any) =>
        (a.startTimeISO || a.startTimeDisplay || '').localeCompare(
          b.startTimeISO || b.startTimeDisplay || ''
        )
    )
  } else {
    // Hide any previously stored specials if they were accidentally persisted
    day7.items = day7.items.filter((i: any) => {
      const n = (i.name || '').toLowerCase()
      return !(
        n.includes('maya hotel ubud') ||
        n.includes('candlelight')
      )
    })
  }
}

    const res = NextResponse.json<ActivitiesData>({ days })
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res
  } catch (e: any) {
    const msg = e?.body?.message || e?.message || 'Notion API error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/* -------------------- helpers -------------------- */

function enumerateDates(startISO: string, endISO: string) {
  const out: string[] = []
  const start = new Date(startISO + 'T00:00:00Z')
  const end   = new Date(endISO   + 'T00:00:00Z')
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
function prettyShortDate(isoDate: string) {
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) // "Aug 22"
}

function getDateRange(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'date' && p.date?.start) {
      return { start: p.date.start as string, end: (p.date.end as string) ?? null }
    }
  }
  return { start: null, end: null }
}
function splitDateTime(iso: string | null): { dateOnly: string | null; timeDisplay: string | null } {
  if (!iso) return { dateOnly: null, timeDisplay: null }
  try {
    const d = new Date(iso)
    const dateOnly = d.toISOString().slice(0, 10)
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return { dateOnly, timeDisplay: `${hh}:${mm}` }
  } catch {
    return { dateOnly: null, timeDisplay: null }
  }
}

function getTitle(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'title') {
      const t = p.title?.[0]?.plain_text || p.title?.[0]?.text?.content
      if (t) return t
      const joined = (p.title || []).map((r: any) => r.plain_text || r.text?.content).filter(Boolean).join('')
      if (joined) return joined
    }
  }
  return null
}
function getText(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (!p) continue
    if (p.type === 'rich_text') {
      const joined = (p.rich_text || []).map((r: any) => r.plain_text || r.text?.content).filter(Boolean).join('')
      if (joined) return joined
    }
    if (p.type === 'title') {
      const joined = (p.title || []).map((r: any) => r.plain_text || r.text?.content).filter(Boolean).join('')
      if (joined) return joined
    }
    if (p.type === 'url' && p.url) return p.url
    if (p.type === 'select' && p.select?.name) return p.select.name
    if (p.type === 'multi_select' && p.multi_select?.length) {
      const joined = p.multi_select.map((s: any) => s.name).filter(Boolean).join(', ')
      if (joined) return joined
    }
  }
  return null
}
function getSelectName(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'select' && p.select?.name) return p.select.name
  }
  return null
}
function getCheckbox(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'checkbox') return Boolean(p.checkbox)
  }
  return null
}
function getNumber(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'number') return p.number as number
    if (p?.type === 'rich_text') {
      const str = (p.rich_text || []).map((r: any) => r.plain_text || r.text?.content).filter(Boolean).join('')
      const num = Number(str)
      if (!Number.isNaN(num)) return num
    }
  }
  return null
}
function getPrice(props: any, names: readonly string[]) {
  const n = getNumber(props, names)
  if (typeof n === 'number') return n
  const t = getText(props, names)
  return t ?? null
}
function getUrl(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'url' && p.url) return p.url as string
  }
  return null
}

function getFirstFileUrl(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (!p) continue
    if (p.type === 'files' && Array.isArray(p.files) && p.files.length) {
      const f = p.files[0]
      if (f?.type === 'file') return f.file?.url as string
      if (f?.type === 'external') return f.external?.url as string
    }
  }
  return null
}

function getFirstFileRef(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'files' && Array.isArray(p.files) && p.files.length) {
      return { propName: n, index: 0 }
    }
  }
  return null
}