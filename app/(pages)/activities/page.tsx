'use client'
import * as React from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import relativeTime from 'dayjs/plugin/relativeTime'
import Image from 'next/image'
import {
  Box, Card, Typography, Chip, Sheet, Button, Grid,
  AccordionGroup, Accordion, AccordionSummary, AccordionDetails,
  AspectRatio, Stack, Divider, Link as JoyLink, CardCover, Skeleton
} from '@mui/joy'
import { MapPin, Clock, BadgeCheck, CreditCard, ExternalLink, Ticket, Video, Sparkles } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import { useUnsplash } from '../../../lib/hooks/useUnsplash'
import { mapsLinkFromQuery } from '../../../lib/utils'
import type { DayData, ActivityItem, ActivitiesData } from '../../../types'
import { isToday, isTomorrow, isYesterday, format, isThisWeek } from 'date-fns'
import { LazyActivityCover } from '../../../components/ActivityCover'

// Lazy heavy children
const TicketPDFViewer = React.lazy(() => import('../../../components/TicketPDFViewer'))
const FoodNear = React.lazy(() => import('../../../components/FoodCard'))

dayjs.extend(relativeTime)
dayjs.extend(utc);
dayjs.extend(timezone);
// Get the viewer's local IANA TZ (e.g. "Asia/Makassar")
// NOTE: Only available in the browser.
const getUserTZ = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const fetcher = (url: string) =>
  fetch(url).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })

/* ---------- helpers ---------- */

function dayQuery(day: DayData) {
  const label = (day).items?.[0]?.location?.toLowerCase() || ''
  if (day.items?.[0]?.name?.includes('Birthday')) return '30 birthday celebration happy birthday'
  if (day.dayNumber === 4) return 'Night Clubing bali'
  if (day.dayNumber === 5) return 'Afro Clubing'
  if (day.dayNumber === 8) return 'LUNA beach bali'
  if (label.includes('ubud')) return 'Ubud Bali jungle rice terrace'
  if (label.includes('uluwatu') || label.includes('temple')) return 'Uluwatu temple Bali sunset'
  if (label.includes('beach') || label.includes('seminyak')) return 'Seminyak Bali beach sunset'
  return 'Bali island tropical landscape'
}
function timeLabel(item: ActivityItem) {
  const s = (item as any).startTimeDisplay
  const e = (item as any).endTimeDisplay
  if (s && e) return `${s}–${e}`
  return s || e || '—'
}

function timeTillStart(_day: DayData, item: ActivityItem) {
  const startISO = (item as any).startTimeISO as string | undefined;
  if (!startISO) return timeLabel(item);

  const tz = getUserTZ();
  console.log('User TZ:', tz);

  // normalize both to the same timezone
  const when = dayjs(startISO).tz(tz);
  const now = dayjs().tz(tz);
  console.log('Activity start time:', when.format(), 'Now:', now.format());

  const diff = when.diff(now, "minute");

  if (diff <= -1) {
    return `${timeLabel(item)} • started ${when.from(now)}`;
  }
  return `${timeLabel(item)} • starts ${when.from(now)}`;
}
function isPastActivity(_day: DayData, item: ActivityItem) {
  const endISO = (item as any).endTimeISO as string | undefined;
  const startISO = (item as any).startTimeISO as string | undefined;

  const tz = getUserTZ();

  // Convert to the user's timezone for a fair comparison
  const ref   = dayjs().tz(tz);
  const end   = endISO   ? dayjs(endISO).tz(tz)   : null;
  const start = startISO ? dayjs(startISO).tz(tz) : null;

  if (end)   return end.isBefore(ref);
  if (start) return start.isBefore(ref);
  return false;
}
function todayBaliISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
function getRelativeDayLabel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'today'
  if (isTomorrow(d)) return 'tomorrow'
  if (isYesterday(d)) return 'yesterday'
  if (isThisWeek(d)) return format(d, 'EEEE')
  return format(d, 'dd MMM')
}
const isBirthday = (d?: string) => d ? (dayjs(d).month() === 7 && dayjs(d).date() === 22) : false
const dayIsAug22 = (day: DayData) => day.dateISO ? isBirthday(day.dateISO) : (day as any).dayLabel?.toLowerCase()?.includes('aug 22')
function statusChip(item: ActivityItem) {
  if ((item as any).paid) return <Chip size="sm" color="success" variant="soft" startDecorator={<BadgeCheck size={14}/>}>Paid</Chip>
  if ((item as any).booked) return <Chip size="sm" color="neutral" variant="soft" startDecorator={<CreditCard size={14}/>}>Awaiting payment</Chip>
  return <Chip size="sm" color="danger" variant="soft">Pay onsite</Chip>
}

/* ---------- skeletons ---------- */

function ChipsSkeleton() {
  return (
    <Box sx={{ display:'flex', gap:0.5, overflowX:'hidden', pb:1 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" sx={{ borderRadius: 999, width: 100, height: 36 }}/>
      ))}
    </Box>
  )
}
function HeaderSkeleton() {
  return <Skeleton variant="rectangular" sx={{ height: { xs: 190, md: 260 }, borderRadius: 'xl' }}/>
}
function CardSkeleton() {
  return (
    <Card variant="outlined" sx={{ overflow:'hidden' }}>
      <Skeleton variant="rectangular" sx={{ height: 120 }}/>
      <Box sx={{ p: 1.5 }}>
        <Skeleton variant="text" level="title-md" sx={{ width: '60%' }}/>
        <Box sx={{ display:'flex', gap:1, mt:1 }}>
          <Skeleton variant="rectangular" sx={{ width: 80, height: 24, borderRadius: 999 }}/>
          <Skeleton variant="rectangular" sx={{ width: 64, height: 24, borderRadius: 999 }}/>
        </Box>
        <Skeleton variant="rectangular" sx={{ mt:1.5, width: '100%', height: 90, borderRadius: 'md' }}/>
      </Box>
    </Card>
  )
}

/* ---------- main ---------- */

export default function Activities() {
  const { data, error, isLoading } = useSWR<ActivitiesData>('/api/notion/activities', fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  const [activeIdx, setActiveIdx] = React.useState(0)
  const swiperRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!data?.days?.length) return
    const today = todayBaliISO()
    const idx = data.days.findIndex(d => d.dateISO === today)
    const safeIdx = idx >= 0 ? idx : 0
    setActiveIdx(safeIdx)
    if (swiperRef.current && typeof swiperRef.current.slideTo === 'function') {
      swiperRef.current.slideTo(safeIdx, 0)
    }
  }, [data])

  if (isLoading) {
    return (
      <Box sx={{ width:'100%', maxWidth:'unset', px:0 }}>
        <ChipsSkeleton />
        <HeaderSkeleton />
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </Stack>
      </Box>
    )
  }

  if (error || !data) return <Typography level="body-sm" color="danger">Couldn’t load activities.</Typography>

  const days = data.days

  return (
    <Box sx={{ width: '100%', maxWidth: 'unset', px: 0 }}>
      {/* Quick-jump chips */}
      <Box sx={{ display:'flex', gap:0.75, overflowX:'auto', pb:1, '&::-webkit-scrollbar':{ display:'none' } }}>
        {days.map((d, i) => {
          const selected = i === activeIdx
          return (
            <Chip
              key={d.dayNumber}
              onClick={() => swiperRef.current?.slideTo(i)}
              variant={selected ? 'solid' : 'soft'}
              color={selected ? 'primary' : 'neutral'}
              sx={{
                minHeight: 42,
                borderRadius: '12px',
                flex: '0 0 auto',
                fontWeight: 600,
                ...(selected
                  ? {
                      bgcolor: '#C792DF',
                      color: '#1b1322',
                      boxShadow: '0 6px 18px rgba(199,146,223,0.35)',
                      border: '1px solid rgba(255,255,255,0.25)',
                    }
                  : {
                      bgcolor: 'background.surface',
                      color: 'text.primary',
                      border: '1px solid #DDDDDF40',
                    }),
                '&:hover': selected
                  ? { opacity: 0.95 }
                  : { borderColor: '#D0C4DF', bgcolor: 'background.level1' },
              }}
            >
              {d.dateISO ? `${getRelativeDayLabel(d.dateISO)} (Day ${d.dayNumber})` : `Day ${d.dayNumber}`}
              {dayIsAug22(d) && <span style={{ marginLeft: 4, color: '#FF4081' }}>🎉</span>}
            </Chip>
          )
        })}
      </Box>

      {/* Swipeable days (lightweight slides; heavy content only on active) */}
      <Swiper
        onSwiper={(inst) => (swiperRef.current = inst)}
        onSlideChange={(s) => setActiveIdx(s.activeIndex)}
        spaceBetween={16}
        slidesPerView={1}
        style={{ width: '100%', overflow: 'hidden', paddingInline: 10 }}
      >
        {days.map((day, i) => (
          <SwiperSlide key={day.dayNumber}>
            <DaySlide day={day} isActive={i === activeIdx} />
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  )
}

/* ---------- day slide ---------- */

function DaySlide({ day, isActive }: { day: DayData; isActive: boolean }) {
  // Header image only (cheap). Cards won’t fetch Unsplash.
  const query = React.useMemo(() => dayQuery(day), [day.dayNumber, day.items])
  const { image: hero } = useUnsplash(query, { orientation: 'landscape' })
  const headerSrc = hero?.urls?.regular || day.headerImage
  const count = day.items?.length ?? 0

  return (
    <Box sx={{ pt: 1, maxWidth:'100%', overflowX:'hidden' }}>
      {!!headerSrc ? (
        <ParallaxHeader
          src={headerSrc}
          badge={dayIsAug22(day) ? '🎂 Birthday — 22 Aug' : day.dateISO ?? undefined}
          footer={`Day ${day.dayNumber} · ${count} activit${count === 1 ? 'y' : 'ies'}`}
        />
      ) : (
        <HeaderSkeleton />
      )}

      {/* Only render the heavy list when active */}
      {isActive ? (
        <Stack spacing={1.5} sx={{ mt: headerSrc ? 1.5 : 1.5, maxWidth:'100%' }}>
          {day.items.map((item, idx) => {
            const past = isPastActivity(day, item)
            const specialDay7 = day.dayNumber === 7 && (
              (item.name || '').toLowerCase().includes('maya hotel ubud') ||
              (item.name || '').toLowerCase().includes('candlelight')
            )
            return (
              <AgendaCard
                key={`${day.dayNumber}-${idx}`}
                item={item}
                day={day}
                dim={past}
                special={specialDay7 || dayIsAug22(day)}
              />
            )
          })}
          {(!day.items || day.items.length === 0) && <CardSkeleton />}
        </Stack>
      ) : (
        <Box sx={{ mt: 1.5 }}>
          {/* Lightweight placeholder when slide isn’t active */}
          <Skeleton variant="rectangular" sx={{ height: 90, borderRadius: 'md' }} />
        </Box>
      )}
    </Box>
  )
}

/* ---------- header ---------- */

function ParallaxHeader({ src, badge, footer }: {
  src: string; badge?: string; footer?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ref.current) return
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          const y = (window.scrollY || 0) * 0.15
          ref.current!.style.setProperty('--parY', `${Math.min(y, 80)}px`)
          ticking = false
        })
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        height: { xs: 190, md: 260 },
        borderRadius: 'xl',
        overflow: 'hidden',
        transform: 'translate3d(0,0,0)',
        boxShadow: 'lg',
        '& .par-img': { transform: 'translate3d(0,var(--parY,0px),0)', transition: 'transform 50ms linear' },
        '&::after': {
          content: '""', position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.6) 100%)'
        }
      }}
    >
      <Image src={src} alt="Day header" fill className="par-img object-cover" />
      {badge && (
        <Chip size="sm" color="primary" startDecorator={<Sparkles size={14}/>} sx={{ position:'absolute', top:10, right:10, zIndex:1 }}>
          {badge}
        </Chip>
      )}
      {footer && (
        <Sheet variant="soft" sx={{
          position:'absolute', left:10, bottom:10, zIndex:1,
          borderRadius:'lg', px:1, py:0.5, bgcolor:'rgba(0,0,0,0.35)', color:'#fff',
          backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.25)'
        }}>
          <Typography level="title-sm">{footer}</Typography>
        </Sheet>
      )}
    </Box>
  )
}

/* ---------- agenda card (lazy heavy content on expand) ---------- */

const AgendaCard = React.memo(function AgendaCard({
  item, day, dim, special,
}: {
  item: ActivityItem
  day: DayData
  dim?: boolean
  special?: boolean
}) {
  const status = statusChip(item)
  const tts = timeTillStart(day, item)
  const [expanded, setExpanded] = React.useState(false)

  // shiny special wrapper
  const shimmer = {
    '@keyframes sheen': {
      '0%':   { transform: 'translateX(-150%) rotate(25deg)' },
      '100%': { transform: 'translateX(150%) rotate(25deg)'  },
    }
  }
  const wrapperSx = special ? {
    position: 'relative',
    borderRadius: 'lg',
    p: 0.75,
    background: `
      conic-gradient(
        from 180deg at 50% 50%,
        #FFD88B, #C49BFF, #9DE1FF, #FFD88B, #C49BFF
      )
    `,
    boxShadow: '0 10px 24px rgba(255, 200, 120, 0.25), 0 2px 8px rgba(196, 155, 255, 0.18)',
    '@media (prefers-reduced-motion: no-preference)': {
      animation: 'border-rotate 18s linear infinite',
      '@keyframes border-rotate': {
        '0%':   { filter: 'hue-rotate(0deg)' },
        '100%': { filter: 'hue-rotate(360deg)' }
      }
    }
  } : {}

  return (
    <Box sx={wrapperSx}>
      <Card
        variant="outlined"
        sx={{
          width:'100%',
          overflow: 'hidden',
          borderWidth: special ? 0 : 1.5,
          borderColor: special ? 'transparent' : 'neutral.outlinedBorder',
          background: special
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'
            : 'background.surface',
          backdropFilter: special ? 'saturate(120%) blur(6px)' : 'none',
          filter: dim && !special ? 'grayscale(0.5)' : 'none',
          opacity: dim && !special ? 0.4 : 1,
          borderRadius: 'md',
          position: 'relative',
          boxShadow: special
            ? 'inset 0 1px 0 rgba(255,255,255,0.28), 0 12px 28px rgba(0,0,0,0.25)'
            : undefined,
          ...(special ? {
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: -2,
              background: 'linear-gradient( to right, transparent, rgba(255,255,255,0.15), transparent )',
              width: '40%',
              transform: 'translateX(-150%) rotate(25deg)',
              pointerEvents: 'none',
              mixBlendMode: 'screen',
              ...shimmer,
              '@media (prefers-reduced-motion: no-preference)': {
                animation: 'sheen 2.75s ease-in-out 0.5s infinite',
              },
            }
          } : {})
        }}
      >
        {/* Keep media cheap: no per-card Unsplash fetch */}
        <CardCover sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
           <LazyActivityCover
              query={item.name || 'travel'}
              fallback={day.headerImage || undefined}
            />
          {special && (
            <Chip
              size="sm"
              variant="solid"
              color="warning"
              startDecorator={<Sparkles size={14} />}
              sx={{
                position: 'absolute',
                top: 10, left: 10,
                borderRadius: '999px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.2,
              }}
            >
              Special
            </Chip>
          )}
        </CardCover>

        <AccordionGroup sx={{ '--Accordion-radius':'md', '--Accordion-gap':'8px' }}>
          <Accordion expanded={expanded} onChange={(_, v)=> setExpanded(Boolean(v))}>
            <AccordionSummary variant="plain">
              <Grid container spacing={1} alignItems="center">
                <Grid xs={12} sm={7}>
                  <Typography
                    level="title-md"
                    fontWeight="lg"
                    sx={special ? {
                      background: 'linear-gradient(90deg, #FFD88B, #C49BFF)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    } : undefined}
                  >
                    {item.name}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt:0.5 }} useFlexGap flexWrap="wrap">
                    <Chip size="sm" variant={special ? 'soft' : 'outlined'} startDecorator={<Clock size={14}/>}>
                      {tts}
                    </Chip>
                    {(item as any).zone && <Chip size="sm" variant={special ? 'soft' : 'outlined'}>{(item as any).zone}</Chip>}
                    {(item as any).category && <Chip size="sm" variant={special ? 'soft' : 'outlined'}>{(item as any).category}</Chip>}
                    {typeof (item as any).price !== 'undefined' && (
                      <Chip size="sm" variant={special ? 'soft' : 'outlined'} startDecorator={<CreditCard size={14}/>}>
                        {typeof (item as any).price === 'number' ? `£${(item as any).price.toFixed(2)}` : (item as any).price}
                      </Chip>
                    )}
                    {status}
                  </Stack>
                </Grid>

                <Grid xs={12} sm={5}>
                  <Stack direction="row" spacing={1} justifyContent={{ xs:'flex-start', sm:'flex-end' }} useFlexGap flexWrap="wrap">
                    {(item as any).location && (
                      <Button size="sm" variant="soft" startDecorator={<MapPin size={16}/>} component={JoyLink} target="_blank" rel="noopener noreferrer" href={mapsLinkFromQuery((item as any).location)}>
                        Open in Maps
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </AccordionSummary>

            <AccordionDetails>
              <Divider sx={{ mb: 1 }} />

              {/* Lazy heavy content ONLY when expanded */}
              <React.Suspense fallback={<Skeleton variant="rectangular" sx={{ height: 120, borderRadius: 'md' }} />}>
                <Stack spacing={1.25}>
                  {(item as any).ticketUrl && (
                    <Sheet
                      variant={special ? 'soft' : 'outlined'}
                      sx={{
                        p:1.5, borderRadius:'md',
                        bgcolor: special ? 'background.level2' : 'background.surface',
                        border: '1px solid', borderColor: 'divider'
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb:1 }}>
                        <Ticket size={16}/> <Typography level="title-sm">Ticket</Typography>
                      </Stack>

                      {/\.(pdf)(\?|$)/i.test((item as any).ticketUrl) || (item as any).ticketUrl?.includes('/api/notion/file') ? (
                        <TicketPDFViewer url={(item as any).ticketUrl} />
                      ) : (
                        <AspectRatio ratio="16/9" variant="outlined" sx={{ borderRadius:'md' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={(item as any).ticketUrl} alt="Ticket" />
                        </AspectRatio>
                      )}

                      <Button
                        size="sm"
                        sx={{ mt:1 }}
                        variant={special ? 'solid' : 'soft'}
                        color={special ? 'warning' : 'neutral'}
                        startDecorator={<ExternalLink size={16}/>}
                        component={JoyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={(item as any).ticketUrl}
                      >
                        Open / Download Ticket
                      </Button>
                    </Sheet>
                  )}

                  <Sheet variant="outlined" sx={{ p:1.5, borderRadius:'md', bgcolor:'background.surface' }}>
                    <Typography level="title-sm" sx={{ mb: 0.5 }}>Food near this activity</Typography>
                    <FoodNear near={(item as any).location || (item as any).zone} zone={(item as any).zone}/>
                  </Sheet>

                  {(item as any).tiktokUrl && (
                    <Button
                      size="sm"
                      variant={special ? 'solid' : 'soft'}
                      color={special ? 'warning' : 'neutral'}
                      startDecorator={<Video size={16}/>}
                      component={JoyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      href={(item as any).tiktokUrl}
                      sx={special ? { fontWeight: 600, boxShadow: '0 6px 14px rgba(255,180,60,0.25)' } : {}}
                    >
                      Watch on TikTok
                    </Button>
                  )}
                </Stack>
              </React.Suspense>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>
      </Card>
    </Box>
  )
})