
export function enumerateDates(startISO: string, endISO: string) {
  const out: string[] = []
  const start = new Date(startISO + 'T00:00:00Z')
  const end   = new Date(endISO   + 'T00:00:00Z')
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
export function prettyShortDate(isoDate: string) {
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) // "Aug 22"
}

export function getDateRange(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'date' && p.date?.start) {
      return { start: p.date.start as string, end: (p.date.end as string) ?? null }
    }
  }
  return { start: null, end: null }
}
export function splitDateTime(iso: string | null): { dateOnly: string | null; timeDisplay: string | null } {
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

export function getTitle(props: any, names: readonly string[]) {
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
export function getText(props: any, names: readonly string[]) {
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
export function getSelectName(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'select' && p.select?.name) return p.select.name
  }
  return null
}
export function getCheckbox(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'checkbox') return Boolean(p.checkbox)
  }
  return null
}
export function getNumber(props: any, names: readonly string[]) {
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
export function getPrice(props: any, names: readonly string[]) {
  const n = getNumber(props, names)
  if (typeof n === 'number') return n
  const t = getText(props, names)
  return t ?? null
}
export function getUrl(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'url' && p.url) return p.url as string
  }
  return null
}

export function getFirstFileUrl(props: any, names: readonly string[]) {
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

export function getFirstFileRef(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props[n]
    if (p?.type === 'files' && Array.isArray(p.files) && p.files.length) {
      return { propName: n, index: 0 }
    }
  }
  return null
}


export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m.toString().padStart(2, '0')}m`);
    if (s > 0 ) parts.push(`${s.toString().padStart(2, '0')}s`);

    return parts.join(" ");
}

export function formatDDHHMM(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (d > 0) parts.push(`${d}`.padStart(2, '0'));
    if (h > 0) parts.push(`${h}`.padStart(2, '0'));
    parts.push(`${m.toString().padStart(2, '0')}`);

    return parts.join(":");
}

export function formatDateToDuration(date: Date, base: Date = new Date(0)): string {
  let diff = Math.floor((date.getTime() - base.getTime()) / 1000); // total seconds

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);

  return parts.length > 0 ? parts.join(" ") : "0s";
}