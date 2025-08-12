import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

export async function GET() {
  const notionKey = process.env.NOTION_API_KEY
  const dbId = process.env.NOTION_ACCOMODATION_ID
  const pageId = process.env.NOTION_ACCOMODATION_ID // optional fallback

  if (!notionKey) {
    return NextResponse.json({ error: 'Missing NOTION_API_KEY' }, { status: 400 })
  }
  const notion = new Client({ auth: notionKey })

  try {
    // Prefer a database (first row)
    if (dbId) {
      const q = await notion.databases.query({
        database_id: dbId,
        page_size: 1,
        sorts: [{ property: 'Selected', direction: 'descending' }].filter(Boolean) as any
      })
      const first = q.results?.[0]
      if (!first || !('properties' in first)) {
        return NextResponse.json({ images: [] })
      }

      const prop: any = (first as any).properties?.Images
      const urls = extractImageUrlsFromFilesProperty(prop)
      return NextResponse.json({ images: urls, name: (first as any)?.properties?.Name?.title?.[0]?.text?.content, address: (first as any)?.properties?.Address?.rich_text?.[0]?.text?.content })
    }

    // Fallback: single page with a “images” Files property
    if (pageId) {
      const page = await notion.pages.retrieve({ page_id: pageId })
      // @ts-ignore
      const prop: any = page?.properties?.images
      const urls = extractImageUrlsFromFilesProperty(prop)
      return NextResponse.json({ images: urls })
    }

    return NextResponse.json({ error: 'Provide NOTION_ACCOMMODATION_DB_ID or NOTION_ACCOMMODATION_PAGE_ID' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Notion error' }, { status: 500 })
  }
}

function extractImageUrlsFromFilesProperty(prop: any): string[] {
  if (!prop) return []
  // Notion files property: prop.type === 'files', prop.files = []
  const files = prop?.files || []
  return files.map((f: any) => {
    if (f.type === 'file') return f.file?.url
    if (f.type === 'external') return f.external?.url
    return null
  })
}