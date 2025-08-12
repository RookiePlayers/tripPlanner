'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Box, IconButton, Sheet, Typography } from '@mui/joy'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import '../lib/pdf-worker' // your worker setup

// Avoid SSR for these components
const Document = dynamic(() => import('react-pdf').then(m => m.Document), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(m => m.Page), { ssr: false })

type FileSource = { url?: string; data?: ArrayBuffer | Uint8Array }

function TicketPdfViewerBase({ url, data }: FileSource) {
  const [numPages, setNumPages] = React.useState(0)
  const [page, setPage] = React.useState(1)

  // Responsive width from container
  const wrapRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState<number>(320)

  React.useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.floor(e.contentRect.width)
        if (w > 0) setWidth(w)
      }
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // Stable file + options
  const file = React.useMemo(() => (data ? { data } : url ? { url } : null), [url, data])
  const options = React.useMemo(() => ({}), [])

  return (
    <Sheet variant="outlined" sx={{ p: 1.5, borderRadius: 'md' }}>
      {/* global tweaks to prevent overflow */}
      <style jsx global>{`
        .react-pdf__Page canvas {
          width: 100% !important;
          height: auto !important;
        }
        .react-pdf__Document,
        .react-pdf__Page {
          overflow: hidden;
        }
      `}</style>

      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
        <Typography level="title-sm">Ticket</Typography>
        <Box sx={{ ml:'auto', display:'flex', gap:1 }}>
          <IconButton size="sm" variant="soft" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>
            <ChevronLeft size={16}/>
          </IconButton>
          <IconButton size="sm" variant="soft" disabled={page>=numPages} onClick={()=>setPage(p=>p+1)}>
            <ChevronRight size={16}/>
          </IconButton>
        </Box>
      </Box>

      <Box
        ref={wrapRef}
        sx={{
          width: '100%',
          overflow: 'hidden',      // stop horizontal scroll
          borderRadius: 'md',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {file && (
          <Document
            file={file}
            options={options}
            onLoadSuccess={({ numPages }: { numPages: number }) => {
              setNumPages(numPages)
              setPage(1)
            }}
            loading={<Box sx={{ p: 2 }}><Typography level="body-sm">Loading PDF…</Typography></Box>}
            error={<Box sx={{ p: 2 }}><Typography color="danger" level="body-sm">Failed to load PDF.</Typography></Box>}
          >
            {/* Scale page to container width */}
            <Page
              pageNumber={page}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
      </Box>

      <Box sx={{ display:'flex', justifyContent:'space-between', mt:1 }}>
        <Typography level="body-sm">Page {page} of {numPages || 1}</Typography>
      </Box>
    </Sheet>
  )
}

export default React.memo(TicketPdfViewerBase)