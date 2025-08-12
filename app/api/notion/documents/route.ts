import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import type { DocumentRow } from '../../../../types'

const PROP = {
  name:      ['Name', 'Title'],
  status:    ['Status'],
  type:      ['Type', 'Document Type'],
  paid:      ['Paid'],
  assigned:  ['Date Assigned', 'Assigned'],
  expiring:  ['Date Expiring', 'Expiry', 'Expires'],
  files:     ['Files', 'File', 'Attachment','files'],
  personRel: ['Person', 'Traveller', 'Guest'], // Relation -> People DB
} as const

export async function GET() {
  const key  = process.env.NOTION_API_KEY
  const dbId = process.env.NOTION_DOCUMENTS_DB_ID
  if (!key || !dbId) {
    return NextResponse.json({ error: 'Missing NOTION_API_KEY or NOTION_DOCUMENTS_DB_ID' }, { status: 400 })
  }

  const notion = new Client({ auth: key })

  try {
    // 1) Read all docs (paginate)
    const pages: any[] = []
    let cursor: string | undefined
    do {
      const r = await notion.databases.query({
        database_id: dbId,
        page_size: 50,
        start_cursor: cursor,
        sorts: [{ property: 'Documentation Status', direction: 'ascending' },{
            property: 'Paid',
            direction: 'ascending'
        }]
      } as any)
      pages.push(...r.results)
      cursor = r.has_more ? r.next_cursor! : undefined
    } while (cursor)

    // 2) Collect all relation target page IDs we need to expand
    const personIds = new Set<string>()
    for (const page of pages) {
      const relIds = getRelationIds(page.properties, PROP.personRel)
      relIds.forEach((id:any) => personIds.add(id))
    }

    // 3) Batch fetch related person pages (cache in a map)
    const peopleMap = new Map<string, { name: string | null; avatar: string | null }>()
    if (personIds.size) {
      // Notion rate limits are fine with ~3–5 RPS; this is small enough for 1 batch
      const ids = Array.from(personIds)
      const results = await Promise.all(ids.map(async (id) => {
        try {
          const p = await notion.pages.retrieve({ page_id: id })
          const { name, avatar } = extractPerson(p as any)
          return { id, name, avatar }
        } catch {
          return { id, name: null, avatar: null }
        }
      }))
      results.forEach(({ id, name, avatar }) => {
        peopleMap.set(id, { name, avatar })
      })
    }

    // 4) Build API shape
    const documents: DocumentRow[] = pages.map((page: any) => {
      const props = page.properties
      const relIds = getRelationIds(props, PROP.personRel)
      const primaryPerson = relIds.length ? peopleMap.get(relIds[0]) ?? null : null

      return {
        id: page.id,
        name: getTitle(props, PROP.name) ?? '(unnamed)',
        status: getStatus(props, PROP.status),
        type: getSelect(props, PROP.type),
        person: primaryPerson?.name ?? null,
        personAvatar: primaryPerson?.avatar ?? null, // << usable by Avatar
        paid: getCheckbox(props, PROP.paid) ?? false,
        dateAssigned: getDate(props, PROP.assigned),
        dateExpiring: getDate(props, PROP.expiring),
        files: getFiles(props, PROP.files),
      }
    })

    const res = NextResponse.json({ documents })
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res
  } catch (e: any) {
    const msg = e?.body?.message || e?.message || 'Notion API error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/* ---------------- helpers ---------------- */

function getRelationIds(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'relation' && Array.isArray(p.relation)) {
      return p.relation.map((r: any) => r?.id).filter(Boolean)
    }
  }
  return [] as string[]
}

function extractPerson(page: any): { name: string | null; avatar: string | null } {
  // Try common properties in your People DB
  const props = page.properties || {}

  // 1) Prefer a title "Name"
  const name =
    getTitle(props, ['Name', 'Title']) ??
    // or a plain text fallback
    getText(props, ['Name', 'Title']) ??
    null

  // 2) Avatar: try a "Photo/Avatar/Image" files/url property; else page.icon/cover
  const avatarFile =
    getFirstFileUrl(props, ['Avatar', 'Photo', 'Image', 'Picture']) ??
    null

  const iconUrl = page.icon?.type === 'external' ? page.icon.external?.url
                : page.icon?.type === 'file'     ? page.icon.file?.url
                : null
  const coverUrl = page.cover?.type === 'external' ? page.cover.external?.url
                 : page.cover?.type === 'file'     ? page.cover.file?.url
                 : null

  const avatar = avatarFile || iconUrl || coverUrl || null
  return { name, avatar }
}

function getTitle(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'title' && Array.isArray(p.title)) {
      const t = p.title.map((r: any) => r.plain_text || r.text?.content).filter(Boolean).join('')
      if (t) return t
    }
  }
  return null
}
function getText(props: any, names: readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'rich_text') {
      const t = (p.rich_text || []).map((r:any)=> r.plain_text || r.text?.content).filter(Boolean).join('')
      if (t) return t
    }
  }
  return null
}
function getSelect(props:any, names:readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'select' && p.select?.name) return p.select.name as string
    if (p?.type === 'status' && p.status?.name) return p.status.name as string
  }
  return null
}
function getStatus(props:any, names:readonly string[]) {
  // allow either Status(status) or Status(select)
  return getSelect(props, names)
}
function getCheckbox(props:any, names:readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'checkbox') return Boolean(p.checkbox)
  }
  return null
}
function getDate(props:any, names:readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'date' && p.date?.start) return p.date.start as string
  }
  return null
}
function getFiles(props:any, names:readonly string[]) {
  for (const n of names) {
    const p = props?.[n]
    if (p?.type === 'files' && Array.isArray(p.files)) {
      const files = p.files.map((f:any)=> ({
        name: f.name,
        url: f?.file?.url || f?.external?.url
      })).filter((x:any)=> !!x.url)
      if (files.length) return files
    }
  }
  return []
}
function getFirstFileUrl(props:any, names:readonly string[]) {
  const files = getFiles(props, names)
  return files[0]?.url ?? null
}