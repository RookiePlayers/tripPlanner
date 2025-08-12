import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const pageId = searchParams.get('pageId')
  const prop   = searchParams.get('prop')
  const iStr   = searchParams.get('i') || '0'
  const index  = Math.max(0, Number(iStr) | 0)
  const range  = req.headers.get('range') // pass through for PDF.js

  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json({ error: 'Missing NOTION_API_KEY' }, { status: 400 })
  }
  if (!pageId || !prop) {
    return NextResponse.json({ error: 'Missing pageId or prop' }, { status: 400 })
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  try {
    // 1) Get a FRESH signed file URL from Notion
    const page: any = await notion.pages.retrieve({ page_id: pageId })
    const p = page.properties?.[prop]
    if (!p || p.type !== 'files' || !Array.isArray(p.files) || p.files.length === 0) {
      return NextResponse.json({ error: 'No files on this property' }, { status: 404 })
    }
    const file = p.files[Math.min(index, p.files.length - 1)]
    const signedUrl =
      file?.type === 'file'     ? file.file?.url :
      file?.type === 'external' ? file.external?.url :
      null

    if (!signedUrl) {
      return NextResponse.json({ error: 'File URL missing' }, { status: 404 })
    }

    // 2) Fetch the binary from S3 via server (so client stays same-origin)
    const upstream = await fetch(signedUrl, {
      headers: range ? { Range: range } : undefined,
    })

    // 3) Build response with headers PDF.js expects
    const headers = new Headers()
    // Prefer upstream content type if it’s already pdf; else force it
    const ct = upstream.headers.get('content-type')
    headers.set('Content-Type', ct?.includes('pdf') ? ct : 'application/pdf')

    // Range support passthrough
    const ar = upstream.headers.get('accept-ranges') || 'bytes'
    headers.set('Accept-Ranges', ar)

    const cl = upstream.headers.get('content-length')
    if (cl) headers.set('Content-Length', cl)

    const cr = upstream.headers.get('content-range')
    if (cr) headers.set('Content-Range', cr)

    // Security + caching
    headers.set('Cache-Control', 'no-store')
    headers.set('Cross-Origin-Resource-Policy', 'same-site')

    // Status should reflect partial content if range used
    const status = range && upstream.status === 206 ? 206 : 200

    return new NextResponse(upstream.body, { status, headers })
  } catch (e: any) {
    const msg = e?.body?.message || e?.message || 'Notion file proxy error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}