'use client'

import * as React from 'react'
import {
  Card,
  Sheet,
  Stack,
  Typography,
  Button,
  Divider,
  Alert,
  Chip,
  Input,
} from '@mui/joy'
import { Copy, RefreshCw } from 'lucide-react'

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const now = Date.now()
  const diff = now - date.getTime()
  const abs = Math.abs(diff)
  const isFuture = diff < 0

  const seconds = Math.floor(abs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let label: string
  if (seconds < 60) label = `${seconds}s`
  else if (minutes < 60) label = `${minutes}m`
  else if (hours < 24) label = `${hours}h ${minutes % 60}m`
  else label = `${days}d ${hours % 24}h`

  return isFuture ? `in ${label}` : `${label} ago`
}

interface DevInfo {
  userId: string | null
  email: string | null
  uid: string | null
  providerSub: string | null
  ipAddress: string | null
  userAgent: string | null
  issuedAt: string | null
  expiresAt: string | null
  authTime: string | null
  provider: string | null
  accessToken: string | null
  refreshToken: string | null
  authToken: string | null
}

export default function DevToolsPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<DevInfo | null>(null)

  const loadInfo = React.useCallback(async (refresh = false) => {
    setError(null)
    setLoading(true)
    try {
      if (refresh) {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
        if (!refreshRes.ok) {
          const data = await refreshRes.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to refresh session')
        }
      }

      const res = await fetch('/api/auth/dev-info')

      if (res.status === 401) {
        setInfo(null)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error || 'Failed to fetch dev info')
      }

      const data = await res.json()
      setInfo(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load token information.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadInfo()
  }, [loadInfo])

  const copy = async (value: string | null) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      setError('Unable to copy to clipboard.')
    }
  }

  return (
    <Sheet sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Card variant="soft" sx={{ width: 'min(960px, 94vw)', p: { xs: 2, md: 3 }, borderRadius: 'xl' }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Stack spacing={0.5} sx={{ flex: 1 }}>
              <Typography level="h2">Dev Tools</Typography>
              <Typography level="body-sm" sx={{ opacity: 0.7 }}>
                Token inspection for the currently signed-in user.
              </Typography>
            </Stack>
            <Button
              variant="soft"
              startDecorator={<RefreshCw size={16} />}
              onClick={() => loadInfo(true)}
              loading={loading}
            >
              Refresh
            </Button>
          </Stack>

          {error && <Alert variant="soft" color="danger">{error}</Alert>}

          {!loading && !info && (
            <Alert variant="soft" color="warning">
              No authenticated user found. Sign in first.
            </Alert>
          )}

          {info && (
            <>
              <Divider />

              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Chip color="neutral" variant="soft">Email</Chip>
                  <Typography level="body-sm">{info.email || '—'}</Typography>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Chip color="neutral" variant="soft">User ID</Chip>
                  <Typography level="body-sm">{info.userId || '—'}</Typography>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Chip color="neutral" variant="soft">UID</Chip>
                  <Typography level="body-sm">{info.uid || '—'}</Typography>
                </Stack>
                {info.provider && (
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                    <Chip color="neutral" variant="soft">Provider</Chip>
                    <Typography level="body-sm">{info.provider}</Typography>
                  </Stack>
                )}
                {info.providerSub && (
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                    <Chip color="neutral" variant="soft">Provider Sub</Chip>
                    <Typography level="body-sm">{info.providerSub}</Typography>
                  </Stack>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography level="title-md">Session Tokens</Typography>
                <Typography level="body-xs" sx={{ opacity: 0.6 }}>Access Token</Typography>
                <Input
                  value={info.accessToken || ''}
                  readOnly
                  size="sm"
                  endDecorator={
                    <Button size="sm" variant="plain" onClick={() => copy(info.accessToken)} startDecorator={<Copy size={14} />}>
                      Copy
                    </Button>
                  }
                />

                <Typography level="body-xs" sx={{ opacity: 0.6 }}>Refresh Token</Typography>
                <Input
                  value={info.refreshToken || ''}
                  readOnly
                  size="sm"
                  endDecorator={
                    <Button size="sm" variant="plain" onClick={() => copy(info.refreshToken)} startDecorator={<Copy size={14} />}>
                      Copy
                    </Button>
                  }
                />

                <Typography level="body-xs" sx={{ opacity: 0.6 }}>Auth Token</Typography>
                <Input
                  value={info.authToken || ''}
                  readOnly
                  size="sm"
                  endDecorator={
                    <Button size="sm" variant="plain" onClick={() => copy(info.authToken)} startDecorator={<Copy size={14} />}>
                      Copy
                    </Button>
                  }
                />
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography level="title-md">Request Context</Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Chip color="neutral" variant="soft">IP</Chip>
                  <Typography level="body-sm">{info.ipAddress || '—'}</Typography>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Chip color="neutral" variant="soft">User Agent</Chip>
                  <Typography level="body-sm">{info.userAgent || '—'}</Typography>
                </Stack>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography level="title-md">Token Timing</Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Chip color="primary" variant="soft">Auth Time</Chip>
                  <Typography level="body-sm">
                    {timeAgo(info.authTime)}{' '}
                    <Typography level="body-xs" sx={{ opacity: 0.5 }}>{info.authTime || ''}</Typography>
                  </Typography>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Chip color="primary" variant="soft">Issued At</Chip>
                  <Typography level="body-sm">
                    {timeAgo(info.issuedAt)}{' '}
                    <Typography level="body-xs" sx={{ opacity: 0.5 }}>{info.issuedAt || ''}</Typography>
                  </Typography>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Chip color="primary" variant="soft">Expires At</Chip>
                  <Typography level="body-sm">
                    {timeAgo(info.expiresAt)}{' '}
                    <Typography level="body-xs" sx={{ opacity: 0.5 }}>{info.expiresAt || ''}</Typography>
                  </Typography>
                </Stack>
              </Stack>
            </>
          )}
        </Stack>
      </Card>
    </Sheet>
  )
}
