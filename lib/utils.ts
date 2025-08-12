import dayjs from 'dayjs'


type Entry<T> = { v: T; exp: number };
export class LRU<T=unknown> {
  private map = new Map<string, Entry<T>>();
  constructor(private max = 500, private ttlMs = 1000 * 60 * 60 * 24 * 7) {} // 7 days

  get(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (Date.now() > e.exp) { this.map.delete(key); return undefined; }
    // refresh recency
    this.map.delete(key); this.map.set(key, e);
    return e.v;
  }
  set(key: string, v: T) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { v, exp: Date.now() + this.ttlMs });
    // trim
    while (this.map.size > this.max) {
      const first = this.map.keys().next().value;
      if (typeof first === 'string') {
        this.map.delete(first);
      }
    }
  }
}

export function formatTime(t?: string | Date) {
  if (!t) return ''
  return dayjs(t).format('HH:mm')
}

export function timeTill(start: string | Date) {
  const s = dayjs(start)
  const diff = s.diff(dayjs(), 'minute')
  if (diff <= 0) return 'Started'
  if (diff < 60) return `${diff}m`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}h ${m}m`
}

export function statusFromFlags(booked: boolean, paid: boolean): { label: string; color: string } {
  if (paid) return { label: 'Paid', color: 'text-green-600' }
  if (booked && !paid) return { label: 'Awaiting payment', color: 'text-gray-500' }
  return { label: 'Pay onsite', color: 'text-red-600' }
}

export function mapsLinkFromQuery(q: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}


export const EMERGENCY_NUMBERS = [
  { label: "Police", number: "110" },
  { label: "Ambulance", number: "118" },
  { label: "Fire", number: "113" },
  { label: "Tourist Police Bali", number: "+62 361 224111" }
]

export const HOTEL_ADDRESS = "Jalan Wirasaba No 5, Off Jalan Kayu Aya, Seminyak, Bali, 80361"
export const LONDON_ADDRESS = "N7 0HX, London, UK"

export const FLIGHTS = [
  { date:"2025-08-19", from:"Home (N7 0HX)", to:"Heathrow T2", depart:"04:30", arrive:"05:30", note:"Taxi (~53m) — leave 4h before flight" },
  { date:"2025-08-19", from:"LHR", to:"SIN", depart:"09:25", arrive:"05:30 (+1)", note:"SQ305 — Extra legroom 49K/49J" },
  { date:"2025-08-20", from:"SIN", to:"DPS", depart:"06:25", arrive:"09:00", note:"SQ934 — Seats 60J/60K" },
  { date:"2025-08-30", from:"Seminyak Hotel", to:"DPS", depart:"04:30", arrive:"05:00", note:"Taxi (~30m off-peak)" },
  { date:"2025-08-30", from:"DPS", to:"SIN", depart:"07:10", arrive:"10:00", note:"SQ949" },
  { date:"2025-08-30", from:"SIN", to:"LHR", depart:"12:35", arrive:"19:30", note:"SQ318 — Extra legroom 49J/49K" },
  { date:"2025-08-30", from:"Heathrow T2", to:"Home (N7 0HX)", depart:"21:30", arrive:"22:20", note:"Taxi (~49m)" }

]
