// app/api/notion/flights/route.ts
import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import type { BoardingPass, FileRef, FlightLeg, Passenger } from '../../../../types'
import { differenceInSeconds } from 'date-fns'
import { getFirstFileRef, getUrl } from '../../utils';

/** If you re-use these helpers elsewhere, consider importing from a shared util */
function splitDateTime(iso: string | null): { dateOnly: string | null; timeDisplay: string | null } {
  if (!iso) return { dateOnly: null, timeDisplay: null }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { dateOnly: null, timeDisplay: null }
  const dateOnly = d.toISOString().slice(0, 10)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return { dateOnly, timeDisplay: `${hh}:${mm}` }
}
function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  return `${h}h ${m}m`
}

/** Map your Notion properties here (add aliases if needed) */
const PROP = {
  // leg identity
  label:      ['Label', 'Leg', 'Route', 'Flight Leg', 'Title', 'Name'],
  flightLeg:  ['Leg Key', 'Leg', 'flightLeg', 'Flight Leg'],

  // meta
  airline:    ['Airline'],
  flightNo:   ['Flight Number', 'FlightNo', 'Number'],
  class:      ['Class', 'Cabin', 'Travel Class'],
  duration:   ['Duration'],
  route:      ['Route', 'Path'],
  model:      ['Aircraft', 'Model'],
  terminal:   ['Terminal'],

  // times/airports (Notion date for time fields)
  departTime: ['Depart Time', 'Departure Time', 'Dep Time', 'Time Depart'],
  arriveTime: ['Arrive Time', 'Arrival Time', 'Arr Time', 'Time Arrive'],
  departAp:   ['Depart Airport', 'Departure Airport', 'From', 'Origin Airport'],
  departCity: ['Depart City', 'Departure City', 'From City'],
  departWeatherCity: ['Departure WeatherCity'],
  departTerminal: ['Departure Terminal'],
  arriveAp:   ['Arrive Airport', 'Arrival Airport', 'To', 'Destination Airport'],
  arriveCity: ['Arrive City', 'Arrival City', 'To City'],
  arrivalWeatherCity: ['Arrival WeatherCity'],
  arriveTerminal: ['Arrival Terminal'],

  // relations / files
  passengers: ['Passengers', 'Traveller', 'People', 'Passenger'], // Relation or People
  passengerSeat: ['Seat'],
  passengerPass: ['Boarding Pass', 'Boarding Passes', 'Files'],
  files:      ['Files', 'Ticket Receipt', 'Ticket Reciept'],
  image:      ['Image', 'Photo', 'Header'],
} as const

export async function GET() {
  const key  = process.env.NOTION_API_KEY
  const dbId = process.env.NOTION_FLIGHTS_DB_ID
  if (!key || !dbId) {
    return NextResponse.json({ error: 'Missing NOTION_API_KEY or NOTION_FLIGHTS_DB_ID' }, { status: 400 })
  }

  const notion = new Client({ auth: key })

  try {
    // 1) Pull all flight rows
    const pages: any[] = []
    let cursor: string | undefined
    do {
      const res = await notion.databases.query({
        database_id: dbId,
        page_size: 50,
        start_cursor: cursor,
        sorts: [{ property: 'Flight Leg', direction: 'ascending' }],
      } as any)
      pages.push(...res.results)
      cursor = res.has_more ? res.next_cursor! : undefined
    } while (cursor)

    // 2) Build (pre-grouped) legs and collect passenger relations to expand
    type PartialLeg = Omit<FlightLeg, 'passengers' | 'files'> & { passengers: Passenger[]; files?: string }
    type BoardingTmp = Record<string /*legKey*/, Record<string /*personId*/, { seat?: string|null; passes: BoardingPass[] }>>

    const byLeg = new Map<string, PartialLeg>()
    const passengerPageIds = new Set<string>()
    const boardingTmp: BoardingTmp = {}

    for (const page of pages) {
      const props = page.properties || {}

      const label = getTitle(props, PROP.label) ?? getText(props, PROP.label) ?? '(Unnamed leg)'
      const legExplicit = getText(props, PROP.flightLeg)
      const legKey = (legExplicit || legKeyFromLabel(label) || page.id).toUpperCase()

      // Notion date values (prefer the raw start strings for TZ correctness)
      const { start: depStart } = getDateRange(props, PROP.departTime)
      const { start: arrStart } = getDateRange(props, PROP.arriveTime)
      const depSplit = splitDateTime(depStart)
      const arrSplit = splitDateTime(arrStart)

      const fileRef = getFirstFileRef(props, PROP.files) ?? null
      const ticketUrl =
        fileRef
          ? `/api/notion/file?pageId=${page.id}&prop=${encodeURIComponent(fileRef.propName)}&i=${fileRef.index}`
          : (getUrl(props, PROP.files) ?? undefined)

      // Compute duration across time zones
      let duration: string | null = null
      if (depStart && arrStart) {
        const depMs = epochFromLocalOrISO(depStart, inferTZFromProps(props, true))
        const arrMs = epochFromLocalOrISO(arrStart, inferTZFromProps(props, false))
        if (depMs != null && arrMs != null) {
          duration = formatDuration(Math.max(0, differenceInSeconds(new Date(arrMs), new Date(depMs))))
        }
      }

      // Create or update the leg bucket
      const base: PartialLeg = byLeg.get(legKey) ?? {
        id: page.id,
        flightLeg: legKey,
        label,
        airline: getText(props, PROP.airline),
        flightNumber: getText(props, PROP.flightNo),
        class: getText(props, PROP.class),
        duration: duration ?? getText(props, PROP.duration),
        route: getText(props, PROP.route),
        flightModel: getText(props, PROP.model),
        terminal: getText(props, PROP.terminal),
        depart: {
          time: depSplit.timeDisplay,
          date: depSplit.dateOnly,
          airport: getText(props, PROP.departAp),
          city: getText(props, PROP.departCity),
          weatherCity: getText(props, PROP.departWeatherCity),
          terminal: getText(props, PROP.departTerminal),
          // Preserve the actual Notion date (better for exact comparisons)
          dateTime: depStart ?? null,
        },
        arrive: {
          time: arrSplit.timeDisplay,
          date: arrSplit.dateOnly,
          airport: getText(props, PROP.arriveAp),
          city: getText(props, PROP.arriveCity),
          weatherCity: getText(props, PROP.arrivalWeatherCity),
          terminal: getText(props, PROP.arriveTerminal),
          dateTime: arrStart ?? null,
        },
        passengers: [],
        files: ticketUrl,
        image: getFirstFileUrl(props, PROP.image) || getPageImageFallback(page),
      }

      // Merge repeated-row files + image

      const img = getFirstFileUrl(props, PROP.image) || getPageImageFallback(page)
      if (img && !base.image) base.image = img

      // Passenger relations on the SAME row
      const relIds = getRelationIds(props, PROP.passengers)
      relIds.forEach(id => passengerPageIds.add(id))

      // Per-row seat & passes belong to those related passengers
      const seat = getText(props, PROP.passengerSeat) ?? null

      const passes = getFiles(props, PROP.passengerPass).map((f) => {
         const fileRef = getFirstFileRef(props, PROP.passengerPass) ?? null
            const url =
                fileRef ? `/api/notion/file?pageId=${page.id}&prop=${encodeURIComponent(fileRef.propName)}&i=${fileRef.index}`
                : (getUrl(props, PROP.files) ?? undefined)
            
                return { name: f.name, url }
        }) as BoardingPass[]

        console.log("Boarding passes=>>>", passes)

        if (!boardingTmp[legKey]) boardingTmp[legKey] = {}
        for (const pid of relIds) {
            if (!boardingTmp[legKey][pid]) boardingTmp[legKey][pid] = { seat: null, passes: [] }
            if (!boardingTmp[legKey][pid].seat && seat) boardingTmp[legKey][pid].seat = seat
            if (passes?.length) {
            boardingTmp[legKey][pid].passes = dedupePasses([...boardingTmp[legKey][pid].passes, ...passes])
            }
        }

      byLeg.set(legKey, base)
    }

    // 3) Expand passenger pages to get names (and optional avatars if you want)
    const peopleMap = new Map<string, { name: string | null; avatar: string | null }>()
    if (passengerPageIds.size) {
      const ids = Array.from(passengerPageIds)
      for (const batch of chunk(ids, 25)) {
        const results = await Promise.all(batch.map(async (id) => {
          try {
            const p = await notion.pages.retrieve({ page_id: id })
            const props = (p as any).properties || {}
            const nm = getTitle(props, ['Name','Title']) || getText(props, ['Name','Title']) || null
            const iconUrl = (p as any).icon?.type === 'external' ? (p as any).icon.external?.url
                         : (p as any).icon?.type === 'file'     ? (p as any).icon.file?.url
                         : null
            const coverUrl = (p as any).cover?.type === 'external' ? (p as any).cover.external?.url
                          : (p as any).cover?.type === 'file'     ? (p as any).cover.file?.url
                          : null
            return { id, name: nm, avatar: iconUrl || coverUrl || null }
          } catch {
            return { id, name: null, avatar: null }
          }
        }))
        results.forEach(r => peopleMap.set(r.id, { name: r.name, avatar: r.avatar }))
      }
    }

    // 4) Attach passengers to each leg (from boardingTmp + peopleMap)
    for (const [legKey, leg] of byLeg) {
      const passSlots = boardingTmp[legKey] || {}
      const passengers: Passenger[] = Object.keys(passSlots).map(pid => {
        const who = peopleMap.get(pid)
        return {
          name: who?.name ?? null,
          seat: passSlots[pid].seat ?? null,
          boardingPasses: passSlots[pid].passes ?? [],
        } as Passenger
      })
      leg.passengers = dedupePassengers(passengers)
    }

    // 5) Respond grouped by leg
    const flights: FlightLeg[] = Array.from(byLeg.values())
    const res = NextResponse.json({ flights })
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res
  } catch (e: any) {
    const msg = e?.body?.message || e?.message || 'Notion API error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/* ------------------- helpers ------------------- */

function legKeyFromLabel(label?: string | null) {
  if (!label) return null
  const normalized = label
    .replace(/→|&rarr;|->|—|–/g, '-') // normalize arrows to hyphen
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[^A-Z-]/g, '')
  return normalized.includes('-') ? normalized : null
}

function chunk<T>(arr: T[], n: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

function dedupeFiles(files: FileRef[]) {
  const seen = new Set<string>()
  const out: FileRef[] = []
  for (const f of files) {
    const key = `${f.url}::${f.name || ''}`
    if (!seen.has(key)) { seen.add(key); out.push(f) }
  }
  return out
}
function dedupePasses(passes: BoardingPass[]) {
  const seen = new Set<string>()
  return passes.filter(p => {
    const k = `${p.url}::${p.name || ''}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
function dedupePassengers(list: Passenger[]) {
  const seen = new Set<string>()
  const out: Passenger[] = []
  for (const p of list) {
    const key = (p.name || '').toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}

/* ---- property readers ---- */
function getDateRange(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'date' && p.date?.start) {
      return { start: p.date.start as string, end: (p.date.end as string) ?? null }
    }
  }
  return { start: null, end: null }
}
function getTitle(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'title') {
      const t = (p.title || []).map((r:any)=> r.plain_text || r.text?.content).filter(Boolean).join('')
      if (t) return t
    }
  }
  return null
}
function getText(props:any, names:readonly string[]){
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'rich_text') {
      const t = (p.rich_text||[]).map((r:any)=> r.plain_text || r.text?.content).filter(Boolean).join('')
      if (t) return t
    }
    if (p?.type === 'select' && p.select?.name) return p.select.name
    if (p?.type === 'status' && p.status?.name) return p.status.name
    if (p?.type === 'url' && p.url) return p.url
    if (p?.type === 'people' && Array.isArray(p.people) && p.people.length) {
      const names = p.people.map((u:any)=>u.name).filter(Boolean).join(', ')
      if (names) return names
    }
    if (p?.type === 'title') {
      const t = (p.title||[]).map((r:any)=> r.plain_text || r.text?.content).filter(Boolean).join('')
      if (t) return t
    }
  }
  return null
}
function getFiles(props:any, names:readonly string[]): FileRef[] {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'files' && Array.isArray(p.files) && p.files.length) {
      return p.files
        .map((f:any)=> ({ name: f.name as string, url: f?.file?.url || f?.external?.url }))
        .filter((x:any)=> !!x.url) as FileRef[]
    }
  }
  return []
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
function getPageImageFallback(page:any): string | null {
  const iconUrl = page.icon?.type === 'external' ? page.icon.external?.url
                : page.icon?.type === 'file'     ? page.icon.file?.url
                : null
  const coverUrl = page.cover?.type === 'external' ? page.cover.external?.url
                 : page.cover?.type === 'file'     ? page.cover.file?.url
                 : null
  return coverUrl || iconUrl || null
}
function getRelationIds(props:any, names:readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'relation' && Array.isArray(p.relation)) {
      return p.relation.map((r:any)=> r?.id).filter(Boolean) as string[]
    }
  }
  return []
}

/** TZ helpers */
function hasExplicitOffset(s: string) {
  return /z$|[+\-]\d{2}:?\d{2}$/i.test(s)
}
function epochFromLocalOrISO(isoLike: string | null, tz?: string | null): number | null {
  if (!isoLike) return null
  if (hasExplicitOffset(isoLike)) {
    const ms = Date.parse(isoLike)
    return Number.isNaN(ms) ? null : ms
  }
  if (!tz) {
    const ms = Date.parse(isoLike)
    return Number.isNaN(ms) ? null : ms
  }
  return wallTimeToUtcMs(isoLike, tz)
}
function wallTimeToUtcMs(localIso: string, timeZone: string): number {
  const [datePart, timePart = '00:00:00'] = localIso.split('T')
  const [Y, M, D] = datePart.split('-').map(Number)
  const [h, m, s = '0'] = timePart.split(':')
  const hh = Number(h), mm = Number(m), ss = Number(s)
  const utcCandidate = new Date(Date.UTC(Y, (M - 1), D, hh, mm, ss))
  const asTz = new Date(utcCandidate.toLocaleString('en-US', { timeZone }))
  const diff = utcCandidate.getTime() - asTz.getTime()
  return utcCandidate.getTime() + diff
}
function inferTZFromProps(props:any, isDepart:boolean): string | null {
  const city  = isDepart ? getText(props, PROP.departCity) : getText(props, PROP.arriveCity)
  const ap    = isDepart ? getText(props, PROP.departAp)   : getText(props, PROP.arriveAp)
  const guess = inferTZFromAirportOrCity(city || ap || '')
  console.log(guess)
  return guess
}
function inferTZFromAirportOrCity(s: string): string | null {
  const v = s.toLowerCase()
  if (/\b(lhr|heathrow|london)\b/.test(v)) return 'Europe/London'
  if (/\b(sin|changi|singapore)\b/.test(v)) return 'Asia/Singapore'
  if (/\b(dps|denpasar|bali)\b/.test(v))   return 'Asia/Makassar'
  return null
}