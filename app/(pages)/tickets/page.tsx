'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  Box, Card, Chip, Sheet, Typography, Grid, Button, Skeleton, Stack, AspectRatio
} from '@mui/joy'
import { Plane, Clock, User2, Download, Ticket as TicketIcon } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import { FlightLeg, Passenger } from '../../../types'
import { CountdownCompact } from '../../../components/Countdown'
import { isAfter, isBefore } from 'date-fns'

// Use your existing PDF viewer (no Worker)
const TicketPDFViewer = React.lazy(() => import('../../../components/TicketPDFViewer'))


const fetcher = (u: string) => fetch(u).then(r => r.json())
function WeatherChip({ city }: { city: string }) {
  const { data } = useSWR(`/api/weather?city=${encodeURIComponent(city)}`, fetcher)
  if (!data) return null
  const t = Math.round(data.main?.temp ?? 0)
  const d = data.weather?.[0]?.main ?? ''
  return <Chip size="sm" variant="soft">{city}: {t}°C · {d}</Chip>
}

export default function FlightsPage() {
  const { data, error, isLoading } = useSWR<{ flights: FlightLeg[] }>('/api/notion/flights', fetcher)
  const [active, setActive] = React.useState(0)

  if (isLoading) return <FlightsSkeleton />
  if (error) return <Typography level="body-sm" color="danger">Couldn{"'"}t load flights.</Typography>
  if (!data?.flights?.length) return <Typography level="body-sm">No flights found.</Typography>

  const flights = data.flights

  return (
    <div className="space-y-3">

      <Swiper
        onSlideChange={(s)=> setActive(s.activeIndex)}
        spaceBetween={16}
        slidesPerView={1}
        style={{ width: '100%', overflow: 'hidden' }}
      >
        {flights.map((leg) => (
          <SwiperSlide key={leg.flightLeg}>
            <LegSlide leg={leg} />
          </SwiperSlide>
        ))}
      </Swiper>

      <Typography level="body-xs" sx={{ opacity: .7 }}>
        Slide {active + 1} / {flights.length} — swipe to switch legs.
      </Typography>
    </div>
  )
}

/* ---------------- Slide per flight leg ---------------- */

function LegSlide({ leg }: { leg: FlightLeg }) {
  const [showAllPassengers, setShowAllPassengers] = React.useState(false)
  const pax = showAllPassengers ? leg.passengers : leg.passengers.slice(0, 6)
  console.log("LegSlide", { leg })
  return (
    <Box className="space-y-3">
      {/* HERO */}
      <HeroLeg leg={leg} />

      <Grid container spacing={2}>
        {/* Details */}
        <Grid xs={12} >
          <Card variant="outlined">
            <Typography level="title-md" startDecorator={<Plane size={16}/>}>
              {leg.airline || '—'} {leg.flightNumber ? `(${leg.flightNumber})` : ''}
            </Typography>

            <Stack direction="column" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
              {leg.class && <Chip size="sm" variant="soft">{leg.class}</Chip>}
              {
                <div className="mt-2 text-sm"><div className="flex items-center gap-2"><Clock size={14}/> Duration: {leg.duration}</div></div>
              }
              {leg.flightModel && <Chip size="sm" variant="soft">{leg.flightModel}</Chip>}
              {leg.terminal && <Chip size="sm" variant="soft">Terminal {leg.terminal}</Chip>}
               <div className="mt-2 flex gap-2 flex-wrap">
                    <WeatherChip city={leg.depart.weatherCity ?? ""} />
                    <WeatherChip city={leg.arrive.weatherCity ?? ""} />
                  </div>
            </Stack>

            <Grid container spacing={1.25} sx={{ mt: 1.5 }}>
              <Grid xs={12} sm={6}>
                <Sheet variant="soft" sx={{ p: 1.25, borderRadius: 'md' }}>
                  <Typography level="title-sm">Departure</Typography>
                  <Typography level="h4" sx={{ mt: .25 }}>{leg.depart.time || '—'}</Typography>
                  <Typography level="body-sm">{leg.depart.date || '—'}</Typography>
                  <Typography level="body-xs" sx={{ opacity:.7 }}>{`${leg.depart.airport || '—'} | ${leg.depart.terminal}`}</Typography>
                </Sheet>
              </Grid>
              <Grid xs={12} sm={6}>
                <Sheet variant="soft" sx={{ p: 1.25, borderRadius: 'md' }}>
                  <Typography level="title-sm">Arrival</Typography>
                  <Typography level="h4" sx={{ mt: .25 }}>{leg.arrive.time || '—'}</Typography>
                  <Typography level="body-sm">{leg.arrive.date || '—'}</Typography>
                  <Typography level="body-xs" sx={{ opacity:.7 }}>{`${leg.arrive.airport || '—'} | ${leg.arrive.terminal}`}</Typography>
                </Sheet>
              </Grid>
            </Grid>

            {leg.route && (
              <Typography level="body-xs" sx={{ mt: 1, opacity: .7 }}>{leg.route}</Typography>
            )}

            {leg.files && (
              <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} useFlexGap flexWrap="wrap">
                
                  <Button
                    size="sm"
                    variant="soft"
                    startDecorator={<Download size={16}/>}
                    component="a"
                    href={leg.files}
                    target="_blank"
                    rel="noopener"
                  >
                    {"Download full ticket"}
                  </Button>
              </Stack>
            )}
          </Card>
        </Grid>

        {/* Passengers + Boarding passes */}
        <Grid xs={12}>
          <Card variant="outlined">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="title-md" startDecorator={<User2 size={16}/>}>
                Passengers
              </Typography>
              {leg.passengers.length > 6 && (
                <Button size="sm" variant="plain" onClick={()=> setShowAllPassengers(v=>!v)}>
                  {showAllPassengers ? 'Show less' : `Show all (${leg.passengers.length})`}
                </Button>
              )}
            </Stack>

            <Stack spacing={1.25} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
              {pax.map((p) => (
               <Grid xs={12} sm={6} key={p.name}>
                 <PassengerRow p={p} />
               </Grid>
              ))}
              {!pax.length && (
                <Typography level="body-sm" sx={{ opacity:.7 }}>No passengers.</Typography>
              )}

              </Grid>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

/* ---------------- Small subcomponents ---------------- */

function HeroLeg({ leg }: { leg: FlightLeg }) {
  const [from, to] = splitLegLabel(leg.label)
  console.log(leg)
  return (
    <Sheet
      variant="soft"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 'xl',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        minHeight: 180,
        background:
          'radial-gradient(1000px 600px at 0% -20%, #7a5cff44, transparent 60%), ' +
          'radial-gradient(1200px 800px at 120% 20%, #ff9e4444, transparent 40%), ' +
          'linear-gradient(180deg, #0b1022, #171c35)',
      }}
    >
      {/* background image */}
      <Box
        sx={{
          position: 'absolute', inset: 0,
          backgroundImage: leg.image ? `url(${leg.image})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: .28,
          mixBlendMode: 'screen',
          filter: 'saturate(1.1) contrast(1.05)',
        }}
      />

     <Grid container>
      <Grid xs={12} sm={6}>
         <Box sx={{ position:'relative', zIndex:1 }}>
        <Typography level="body-sm" sx={{ opacity:.9 }}>
          Flight: {leg.airline || '—'} {leg.flightNumber ? `(${leg.flightNumber})` : ''}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: .5 }}>
          <Typography level="h1">{from}</Typography>
          <Plane/>
          <Typography level="h1">{to}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
          {leg.class && <Chip size="sm" variant="soft">{leg.class}</Chip>}
          {leg.duration && <Chip size="sm" variant="soft" startDecorator={<Clock size={14}/>}>{leg.duration}</Chip>}
          {leg.flightModel && <Chip size="sm" variant="soft">{leg.flightModel}</Chip>}
          {leg.terminal && <Chip size="sm" variant="soft">Terminal {leg.terminal}</Chip>}
        </Stack>
      </Box>
      </Grid>
     {leg.depart.dateTime && isAfter(new Date(leg.depart.dateTime), Date.now())&&(
      <Grid xs={12} sm={6}>
       <Stack alignItems={"end"} display={"flex"} flexDirection={"column"} justifyContent={"center"} sx={{height:"100%"}}>
         <Typography sx={{
          fontWeight: "bold",
          fontSize: "2rem",
        }}>
          <CountdownCompact
          to={new Date(leg.depart.dateTime || '').getTime()}
          interval={1000}
          autoStart
          stopAtZero
          onComplete={() => console.log('Countdown complete')}
        />
        </Typography>
        <Typography level="body-xs" sx={{ opacity:.75 }}>
          Until departure
        </Typography>
       </Stack>
      </Grid>)}
     </Grid>
    </Sheet>
  )
}

function PassengerRow({ p }: { p: Passenger }) {
  const pass = p.boardingPasses?.[0] // show first; could make an accordion if multiple

  return (
   <Grid container spacing={2}>

     <Sheet variant="soft" sx={{ p: 1.25, borderRadius:'md' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Stack spacing={0.25}>
          <Typography level="title-sm">{p.name}</Typography>
          <Typography level="body-xs" sx={{ opacity:.75 }}>
            Seat {p.seat || '—'}
          </Typography>
        </Stack>

        {pass?.url ? (
          <Button size="sm" variant="soft" startDecorator={<TicketIcon size={16}/>}
            component="a"  
            href={pass?.url} 
            target="_blank" 
            rel="noopener"
          >
            Boarding pass
          </Button>
        ) : null}
      </Stack>

      {/* Inline PDF preview (lazy) */}
      {pass?.url && (
        <Box sx={{ mt: 1 }}>
          <React.Suspense fallback={<Skeleton variant="rectangular" sx={{ height: 180, borderRadius: 'md' }}/>}>
            <TicketPDFViewer url={pass.url} />
          </React.Suspense>
        </Box>
      )}
    </Sheet>
   </Grid>
  )
}

function splitLegLabel(label: string) {
  const parts = label.split(/→|->|—|–|-/).map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) return [parts[0], parts[1]]
  return [label, '']
}

/* ---------------- Skeleton while loading ---------------- */

function FlightsSkeleton() {
  return (
    <div className="space-y-3">
      <Typography level="h2">Flights</Typography>
      <Skeleton variant="rectangular" sx={{ height: 180, borderRadius: 'xl' }} />
      <Grid container spacing={2}>
        <Grid xs={12} md={7}>
          <Card variant="outlined">
            <Skeleton variant="text" level="title-md" />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Skeleton variant="rectangular" sx={{ width: 80, height: 24, borderRadius: 999 }} />
              <Skeleton variant="rectangular" sx={{ width: 120, height: 24, borderRadius: 999 }} />
            </Stack>
            <Grid container spacing={1.25} sx={{ mt: 1.5 }}>
              <Grid xs={12} sm={6}><Skeleton variant="rectangular" sx={{ height: 86, borderRadius: 'md' }} /></Grid>
              <Grid xs={12} sm={6}><Skeleton variant="rectangular" sx={{ height: 86, borderRadius: 'md' }} /></Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid xs={12} md={5}>
          <Card variant="outlined">
            <Skeleton variant="text" level="title-md" />
            <Stack spacing={1.25} sx={{ mt: 1 }}>
              {Array.from({length:3}).map((_,i)=>(
                <Skeleton key={i} variant="rectangular" sx={{ height: 180, borderRadius: 'md' }} />
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}