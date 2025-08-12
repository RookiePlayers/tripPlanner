'use client'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { EMERGENCY_NUMBERS, HOTEL_ADDRESS, mapsLinkFromQuery } from '../lib/utils'
import { Card, Typography, Grid, Button, Sheet, useTheme, AspectRatio, CardCover, Skeleton, Stack } from '@mui/joy'
import { m, motion, useScroll, useTransform } from 'motion/react'
import { HotelMap } from '../components/HotelMap'
import Image from 'next/image'
import AccommodationGallery, { AccommodationGalleryRef } from '../components/Gallery'
import { useUnsplash } from '../lib/hooks/useUnsplash'
import { Sun, Moon, MapPin, Phone, CalendarClock, CreditCard, Car, Navigation, Cloud, ChevronRight } from 'lucide-react'
import { TripProgress } from '../components/TripProgress'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function Clock({ tz, label }: { tz: string; label: string | React.ReactNode}) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now)
  }, [now, tz])

  const hour = useMemo(() => {
    return Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        hour12: false,
      }).format(now)
    )
  }, [now, tz])

  const isDaytime = hour >= 6 && hour < 18

  return (
    <Card variant="soft" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
      <Typography
        level="body-sm"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        {isDaytime ? <Sun size={14} /> : <Moon size={14} />}
        {label}
      </Typography>
      <Typography level="h3" mt={-1}>
        {time}
      </Typography>
    </Card>
  )
}


function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 300], [0, 40])
  const { image, isLoading } = useUnsplash('bali', { orientation:'landscape' })
  React.useEffect(() => {
    const key = 'heroUnsplashUrl'
    if (image?.urls?.regular) sessionStorage.setItem(key, image.urls.regular)
  }, [image])

const cached = typeof window !== 'undefined' ? sessionStorage.getItem('heroUnsplashUrl') : null
  return (
    <Sheet
      variant="soft"
      sx={{
        p: { xs: 2, md: 4 },
        borderRadius: 'xl',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        minHeight: 220,
        background:
          'radial-gradient(1200px 600px at 20% -20%, #7a5cff44, transparent 60%), ' +
          'radial-gradient(1000px 800px at 120% 20%, #ff9e4444, transparent 40%), ' +
          'linear-gradient(180deg, #0b1022, #171c35)',
      }}
    >
      {/* Parallax image (with graceful fallback) */}
      <motion.div
        style={{ y, position: 'absolute', inset: 0 }}
        className="pointer-events-none"
      >
        {isLoading ? (
          <div
            style={{
              position: 'absolute', inset: 0,
              background:
                'linear-gradient(90deg, #ffffff14, #ffffff22, #ffffff14)',
              animation: 'pulse 1.2s ease-in-out infinite',
            }}
          />
        ) : (
          <Image
            src={cached ?? image?.urls?.regular ?? '/images/bali-hero.jpg'}
            alt="Bali"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', opacity: 0.28, mixBlendMode: 'screen' }}
            priority
          />
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Grid container spacing={2}>
          <Grid xs={12} md={6}>
            <Stack>
              <Typography level="h1">
                {greetingForLocalTime('Asia/Makassar')} Bali
              </Typography>
              <div className="mt-3 grid grid-cols-2 md:inline-flex gap-2">
                <Clock tz="Asia/Makassar" label="Bali (WITA)" />
                <Clock tz="Europe/London" label="UK Time" />
              </div>
            </Stack>
          </Grid>

          <Grid xs={12} md={6}>
            <NextUpCard />
          </Grid>
        </Grid>
      </motion.div>
    </Sheet>
  )
}

function greetingForLocalTime(tz: string) {
  try {
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour:'2-digit', hour12:false }).format(new Date()))
    if (hour < 5)  return 'Good night from'
    if (hour < 12) return 'Good morning from'
    if (hour < 18) return 'Good afternoon from'
    return 'Good evening from'
  } catch { return 'Hello from' }
}

function useNextActivity() {
  const { data } = useSWR('/api/notion/activities', (u)=>fetch(u).then(r=>r.json()))
  const todayISO = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Makassar', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date())
  if (!data?.days?.length) return null
  const today = data.days.find((d:any)=> d.dateISO === todayISO) || data.days[0]
  if (!today?.items?.length) return { day: today, item: null }

  // next upcoming based on startTimeISO
  const now = Date.now()
  const upcoming = today.items
    .map((i:any)=> ({...i, t: i.startTimeISO ? Date.parse(i.startTimeISO) : Infinity }))
    .sort((a:any,b:any)=> a.t - b.t)
    .find((i:any)=> i.t > now)

  return { day: today, item: upcoming ?? today.items[0] }
}

function NextUpCard() {
  const next = useNextActivity()
  if (!next) return null
  const { day, item } = next
  const title = item?.name || 'Free day / Arrival'
  const time = item?.startTimeDisplay || '—'
  const loc  = item?.location

  return (
   <Card variant="soft" sx={{
      background:
        'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
      backdropFilter: 'saturate(120%) blur(6px)'
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography level="title-md" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CalendarClock size={18} /> Coming up
        </Typography>
        <Stack direction="row" gap={1} alignItems="center">
          <Button component="a" href="/activities" variant="solid" size="sm">View full day</Button>
          {loc && (
            <Button component="a" href={mapsLinkFromQuery(loc)} target="_blank" rel="noopener" variant="soft" size="sm">
              Open in Maps
            </Button>
          )}
        </Stack>
      </Stack>
      <Typography level="h3" sx={{ mt: .75 }}>{title}</Typography>
      <Typography level="body-sm" sx={{ opacity:.8, mt:.5 }}>
        {day?.dayLabel} • {time}
      </Typography>
    </Card>
  )
}

function WeatherCard({height = "unset"}) {
  const { data, error } = useSWR('/api/weather', fetcher)

  if (error) return <></>
  if (!data) return <Skeleton variant="rectangular" sx={{ height: height, borderRadius: 'md' }} />

  return  data && (<Card variant="outlined" sx={{ height: height, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>

  <div className="mt-2">
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      {/* OpenWeather icons are like 10d, 01n etc */}
      <img
        alt="icon"
        src={`https://openweathermap.org/img/wn/${data.weather?.[0]?.icon || '01d'}@2x.png`}
        width={48} height={48}
        style={{ imageRendering:'pixelated' }}
      />
      <div>
        <Typography level="h2">{Math.round(data.main.temp)}°C</Typography>
        <Typography level="body-sm" sx={{ textTransform:'capitalize' }}>
          {data.weather?.[0]?.description}
        </Typography>
        <Typography level="body-xs">Feels {Math.round(data.main.feels_like)}° • Humidity {data.main.humidity}%</Typography>
      </div>
    </div>

    {/* Sunrise–Sunset progress (optional) */}
    {data.sys?.sunrise && data.sys?.sunset && (
      <div style={{ marginTop: 10 }}>
        <div style={{ height: 6, background: 'var(--joy-palette-neutral-200)', borderRadius: 999 }}>
          {(() => {
            const now = data.dt ? data.dt * 1000 : Date.now()
            const start = data.sys.sunrise * 1000
            const end = data.sys.sunset * 1000
            const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
            return (
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg,#7a5cff,#ff9e44)',
                }}
              />
            )
          })()}
        </div>
        <Typography level="body-xs" sx={{ mt: .5, opacity:.7 }}>
          Sunrise {new Date(data.sys.sunrise*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} •
          Sunset {new Date(data.sys.sunset*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
        </Typography>
      </div>
    )}
  </div>
  </Card>)

}
function QuickActions() {
  const actions = [
    { label: 'Bluebird', href: 'https://bluebirdgroup.com/', icon: <Car size={16} /> },
    { label: 'Grab', href: 'https://grab.com/id', icon: <Car size={16} /> },
    { label: 'Navigate to Hotel', href: mapsLinkFromQuery(HOTEL_ADDRESS), icon: <Navigation size={16} /> },
    { label: 'Activities', href: '/activities', icon: <CalendarClock size={16} /> },
    { label: 'Payments', href: '/payments', icon: <CreditCard size={16} /> },
  ]
  
  return (
    <Sheet variant="outlined" sx={{ p: 1.5, borderRadius: 'lg', display: 'flex', gap: .5, overflowX: 'auto' }}>
      {actions.map(a => (
        <Button
          key={a.label}
          size="sm"
          component="a"
          href={a.href}
          target={a.href.startsWith('http') ? '_blank' : '_self'}
          variant="soft"
          sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: .5 }}
        >
          {a.icon}
          {a.label}
        </Button>
      ))}
    </Sheet>
  )
}

export default function Welcome() {
  const theme = useTheme()
  const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null)
    const galleryRef = React.useRef<AccommodationGalleryRef>(null)
  const { data: accom, error: accomErr } = useSWR('/api/notion/photos', fetcher)

  useEffect(() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude })) }, [])


  return (
    <>
    <div className="space-y-6">
      <Hero/>
      <QuickActions />
      <TripProgress/>
      <Grid container spacing={2}>
        <Grid  xs={12} md={6}>
            <WeatherCard height='100%'/>
        </Grid>
        <Grid xs={12} md={6}>

          <Card>
        <Typography level="title-md">Emergency Contacts</Typography>
        <ul className="mt-2 space-y-1">
          {EMERGENCY_NUMBERS.map(e => (
            <li key={e.label} className="flex justify-between text-sm items-center">
              <span className="flex items-center gap-1"><Phone size={14} /> {e.label}</span>
              <a href={`tel:${e.number}`}>{e.number}</a>
            </li>
          ))}
        </ul>
      </Card>
        </Grid>
      </Grid>

      <Card sx={{overflow: 'hidden', paddingInline: 'sm'}}>
        <Typography level="title-md">Accommodation | {accom?.name}</Typography>
        <Grid container spacing={1} alignItems="center">
          <Grid xs={12}>
            <Typography level="body-sm">{HOTEL_ADDRESS}</Typography>
          </Grid>  
          <Grid xs={12}>
            <HotelMap address={HOTEL_ADDRESS} />
          </Grid>
          <Grid xs={12}>
            <Button sx={{ mt: { xs: 1, md: 0 } }} fullWidth component="a" target="_blank" href={mapsLinkFromQuery(HOTEL_ADDRESS)}>
              Navigate
            </Button>
          </Grid>
        </Grid>
      </Card>
    </div>
          <AccommodationGallery ref={galleryRef} />

    </>
  )
}
