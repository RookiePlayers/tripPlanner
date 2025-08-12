// app/documents/page.tsx
'use client'

import * as React from 'react'
import useSWR from 'swr'
import { Card, Typography, Button, Chip, Sheet, Stack, Divider, Grid, Skeleton, Avatar } from '@mui/joy'
import { FileText, ShieldCheck, Clock, CalendarClock, ExternalLink, UserRound } from 'lucide-react'
import { DocumentRow } from '../../../types'

const fetcher = (u:string)=> fetch(u).then(r=> r.json())

function StatusChip({ status }: { status?: string | null }) {
  const m: Record<string, { color: any; icon?: React.ReactNode }> = {
    Approved:     { color: 'success', icon: <ShieldCheck size={14}/> },
    'Not Started':{ color: 'neutral' },
    Pending:      { color: 'warning' },
    Expired:      { color: 'danger' },
  }
  const cfg = (status && m[status]) || { color: 'neutral' as const }
  return (
    <Chip size="sm" color={cfg.color} startDecorator={cfg.icon ?? undefined}>
      {status || '—'}
    </Chip>
  )
}


function DocCard({ doc }: { doc: DocumentRow }) {
  return (
    <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {/* Title & Status */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        
        <StatusChip status={doc.status} />
      </Stack>

      {/* Person */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{
          p: 1,
          borderRadius: 'sm',
          backgroundColor: 'var(--joy-palette-primary-softBg)',
        }}
      >
        <Avatar
          size="sm"
          variant="solid"
          color="primary"
          src={doc.personAvatar || undefined}
        >
          <UserRound size={14} />
        </Avatar>
        <Typography level="body-sm" fontWeight={500}>
          {doc.person || ''}
        </Typography>
      </Stack>

      {/* Meta info */}
      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip size="sm" variant="soft" startDecorator={<FileText size={14} />}>
          {doc.type || '—'}
        </Chip>
        {typeof doc.paid === 'boolean' && (
          <Chip size="sm" variant="soft" color={doc.paid ? 'success' : 'neutral'}>
            {doc.paid ? 'Paid' : 'Unpaid'}
          </Chip>
        )}
      </Stack>

      {/* Dates */}
      <Stack direction="row" gap={2} flexWrap="wrap" sx={{ opacity: 0.9 }}>
        {doc.dateAssigned && (
          <Stack direction="row" gap={0.5} alignItems="center">
            <Clock size={14} />
            <Typography level="body-xs">Assigned {doc.dateAssigned}</Typography>
          </Stack>
        )}
        {doc.dateExpiring && (
          <Stack direction="row" gap={0.5} alignItems="center">
            <CalendarClock size={14} />
            <Typography level="body-xs">Expires {doc.dateExpiring}</Typography>
          </Stack>
        )}
      </Stack>

      <Divider />

      {/* Files */}
      {doc.files?.length ? (
        <Stack direction="row" gap={1} flexWrap="wrap">
          {doc.files.map((f, i) => (
            <Button
              key={i}
              size="sm"
              variant="soft"
              color='success'
              startDecorator={<ExternalLink size={16} />}
              component="a"
              href={f.url}
              target="_blank"
              rel="noopener"
            >
              {f.name || 'View Document'}
            </Button>
          ))}
        </Stack>
      ) : (
        <Typography level="body-xs" sx={{ opacity: 0.7 }}>
          No file uploaded
        </Typography>
      )}
    </Card>
  )
}

export default function DocumentsPage() {
  const { data, error, isLoading } = useSWR<{documents: DocumentRow[]}>('/api/notion/documents', fetcher)

  return (
    <div className="space-y-3">
      <Typography level="h2">Travel Documents</Typography>

      {isLoading && (
        <Grid container spacing={2}>
          {Array.from({length:6}).map((_,i)=>(
            <Grid key={i} xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <Skeleton variant="text" level="title-md" />
                <Skeleton variant="rectangular" sx={{ height: 18, mt: 1, borderRadius: 8 }} />
                <Skeleton variant="rectangular" sx={{ height: 18, mt: 1, borderRadius: 8 }} />
                <Skeleton variant="rectangular" sx={{ height: 36, mt: 2, borderRadius: 8 }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {error && (
        <Sheet variant="soft" sx={{ p:2, borderRadius:'md' }}>
          <Typography level="body-sm" color="danger">
            Couldn’t load from Notion.
          </Typography>
        </Sheet>
      )}

      {!!data?.documents?.length && (
        <Grid container spacing={2}>
          {data.documents.map(doc => (
            <Grid key={doc.id} xs={12} md={6} lg={4}>
              <DocCard doc={doc} />
            </Grid>
          ))}
        </Grid>
      )}

      {!isLoading && !error && (!data?.documents || data.documents.length === 0) && (
        <Typography level="body-sm" sx={{ opacity:.7 }}>No documents yet.</Typography>
      )}
    </div>
  )
}