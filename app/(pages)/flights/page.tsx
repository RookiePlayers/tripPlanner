'use client'
import dayjs from 'dayjs'
import * as React from 'react'
import { FLIGHTS } from '../../../lib/utils'
import {
  Card, Typography, Stack, Box, Chip, Sheet, Divider,
} from '@mui/joy'
import { Plane, Clock, MapPin } from 'lucide-react'

export default function Flights() {
  const now = dayjs()

  return (
    <Stack spacing={2}>

      <Stack spacing={1.5}>
        {FLIGHTS.map((f, i) => {
          const dep = dayjs(`${f.date} ${f.depart}`)
          const isPast = dep.isBefore(now)
          const isCurrent = dep.isBefore(now) && now.diff(dep, 'hour') < 15

          return (
            <Card
              key={i}
              variant={isCurrent ? 'soft' : 'outlined'}
              sx={{
                opacity: isPast ? 0.65 : 1,
                borderColor: isCurrent ? 'primary.outlinedBorder' : undefined,
                boxShadow: isCurrent ? 'lg' : 'sm',
                outline: isCurrent ? '2px solid' : 'none',
                outlineColor: isCurrent ? 'var(--brand-1)' : 'transparent',
              }}
            >
              {/* Top row: date + route */}
              <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
                <Typography level="body-xs" sx={{ opacity: 0.8 }}>
                  {f.date}
                </Typography>
                {isCurrent && <Chip size="sm" color="primary" variant="soft">In progress</Chip>}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                <MapPin size={16} />
                <Typography level="title-sm" sx={{ mr: 0.5 }}>{f.from}</Typography>
                <Typography level="title-sm" sx={{ opacity: 0.7 }}>→</Typography>
                <Typography level="title-sm" sx={{ ml: 0.5 }}>{f.to}</Typography>
              </Stack>

              <Divider sx={{ my: 1.25 }} />

              {/* Times */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                }}
              >
                <Sheet variant="soft" sx={{ p: 1.25, borderRadius: 'md' }}>
                  <Typography level="body-xs" sx={{ opacity: 0.7 }}>Depart</Typography>
                  <Typography level="title-md">{f.depart}</Typography>
                </Sheet>

                <Sheet variant="soft" sx={{ p: 1.25, borderRadius: 'md' }}>
                  <Typography level="body-xs" sx={{ opacity: 0.7 }}>Arrive</Typography>
                  <Typography level="title-md">{f.arrive}</Typography>
                </Sheet>
              </Box>

              {/* Note / extra */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Clock size={16} />
                <Typography level="body-sm" sx={{ opacity: 0.85 }}>
                  {f.note}
                </Typography>
              </Stack>

              {/* Footer timeline accent */}
              <Box
                sx={{
                  mt: 1.25,
                  height: 6,
                  borderRadius: 999,
                  bgcolor: isPast ? 'neutral.softActiveBg' : 'neutral.softBg',
                  ...(isCurrent && {
                    bgcolor: 'primary.solidBg',
                  }),
                }}
              />
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}