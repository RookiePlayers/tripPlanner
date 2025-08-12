import * as React from 'react'
import { Sheet, Typography, Chip, Box, Stack } from '@mui/joy'
import { CalendarDays, Flag, PlaneTakeoff, PlaneLanding, Clock } from 'lucide-react'

type TripProgressProps = {
  /** Trip start (local to tz) */
  startISO?: string
  /** Trip end (local to tz) */
  endISO?: string
  /** IANA timezone for local trip time */
  tz?: string
  /** Show compact footer line with dates */
  showDates?: boolean
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function startOfDayLocalISO(dateISO: string, tz: string) {
  // Normalize to local midnight in tz, then get ms since epoch
  const d = new Date(`${dateISO}T00:00:00`)
  // Use Intl to format back to parts in tz, then rebuild
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d)
  const y = parts.find(p=>p.type==='year')?.value
  const m = parts.find(p=>p.type==='month')?.value
  const da= parts.find(p=>p.type==='day')?.value
  return `${y}-${m}-${da}T00:00:00`
}

function endOfDayLocalISO(dateISO: string, tz: string) {
  const d = new Date(`${dateISO}T23:59:59`)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d)
  const y = parts.find(p=>p.type==='year')?.value
  const m = parts.find(p=>p.type==='month')?.value
  const da= parts.find(p=>p.type==='day')?.value
  return `${y}-${m}-${da}T23:59:59`
}

export function TripProgress({
  startISO = '2025-08-20',
  endISO   = '2025-08-29',
  tz       = 'Asia/Makassar',
  showDates = true,
}: TripProgressProps) {

  const { pct, currentDay, totalDays, daysLeft, state, nowFmt } = React.useMemo(() => {
    const startLocalISO = startOfDayLocalISO(startISO, tz)
    const endLocalISO   = endOfDayLocalISO(endISO, tz)

    const startMs = new Date(startLocalISO).getTime()
    const endMs   = new Date(endLocalISO).getTime()

    // "now" in TZ
    const now = new Date()
    const nowParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
    }).format(now)
    const nowMs = new Date(nowParts.replace(',','')).getTime()

    const dayMs = 24 * 60 * 60 * 1000
    const totalDays = Math.max(1, Math.round((endMs - startMs) / dayMs) + 1)

    let state: 'not-started' | 'in-progress' | 'finished'
    if (nowMs < startMs) state = 'not-started'
    else if (nowMs > endMs) state = 'finished'
    else state = 'in-progress'

    // Day index (1-based, inclusive)
    let currentDay = state === 'not-started'
      ? 0
      : clamp(Math.floor((nowMs - startMs) / dayMs) + 1, 1, totalDays)

    const daysLeft = state === 'in-progress'
      ? Math.max(0, totalDays - currentDay)
      : state === 'not-started'
        ? totalDays
        : 0

    const rawPct = state === 'not-started'
      ? 0
      : state === 'finished'
        ? 100
        : ((nowMs - startMs) / (endMs - startMs)) * 100

    const pct = clamp(Math.round(rawPct), 0, 100)

    return {
      pct, currentDay, totalDays, daysLeft, state,
      nowFmt: new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour:'2-digit', minute:'2-digit'
      }).format(now),
    }
  }, [startISO, endISO, tz])

  const label =
    (state === 'not-started') ? 'Trip not started' :
    (state === 'finished')    ? 'Trip completed'   :
    `Day ${currentDay} of ${totalDays} • ${daysLeft} day${daysLeft===1?'':'s'} left`

  return (
    <Sheet variant="outlined" sx={{ p: 1.25, borderRadius: 'lg' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:.5 }}>
        {state === 'not-started' ? <PlaneTakeoff size={16}/> :
         state === 'finished'    ? <PlaneLanding size={16}/> :
                                   <CalendarDays size={16}/>}
        <Typography level="title-sm">Trip progress</Typography>
        <Chip size="sm" variant="soft" sx={{ ml: 'auto' }}>
          {label}
        </Chip>
      </Box>

      {/* Progress bar */}
      <Box
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Trip progress"
        sx={{
          position:'relative',
          height: 10,
          borderRadius: 999,
          background: 'var(--joy-palette-neutral-200)',
          overflow:'hidden',
        }}
      >
        {/* Filled track */}
        <Box
          sx={{
            position:'absolute', inset:0, width:`${pct}%`,
            transition:'width 500ms ease',
            background: 'linear-gradient(90deg,#7a5cff,#ff9e44)',
          }}
        />
        {/* Marker */}
        <Box
          sx={{
            position:'absolute',
            top:'50%', left: `calc(${pct}% - 6px)`,
            transform:'translateY(-50%)',
            width: 12, height: 12, borderRadius:'50%',
            boxShadow:'0 0 0 2px rgba(255,255,255,0.6)',
            background: 'linear-gradient(180deg,#ffffff,#d7d7ff)',
            transition:'left 500ms ease',
          }}
          aria-hidden
        />
      </Box>

      {/* Footer */}
      <Stack sx={{ gap:1, mt:.5 }} justifyContent={'space-between'} direction="row">
       <Stack direction="row" alignItems="center" gap={1}>
         <Clock size={14} />
         <Typography level="body-xs" sx={{ opacity:.7 }}>
           {pct}% complete • Local time {nowFmt}
         </Typography>
       </Stack>
        {showDates && (
          <Stack direction="row" alignItems="center" gap={1}>
            <Flag size={12} style={{ marginRight: 6 }}/>
            <Typography level="body-xs" sx={{ opacity:.5 }}>
              {startISO} → {endISO}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Sheet>
  )
}