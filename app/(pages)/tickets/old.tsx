'use client'
import { useState } from 'react'
import { Card, Typography, Grid, Chip, Sheet, Button } from '@mui/joy'
import { Plane, User2, Clock, Download, LucidePlane } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import useSWR from 'swr'


const fetcher = (url: string) => fetch(url).then(r => r.json())

function WeatherChip({ city }: { city: string }) {
  const { data } = useSWR(`/api/weather?city=${encodeURIComponent(city)}`, fetcher)
  if (!data) return null
  const t = Math.round(data.main?.temp ?? 0)
  const d = data.weather?.[0]?.main ?? ''
  return <Chip size="sm" variant="soft">{city}: {t}°C · {d}</Chip>
}

type Segment = {
  label: string
  airline: string
  cls: string
  duration: string
  depart: { time: string, date: string, airport: string, weatherCity: string }
  arrive: { time: string, date: string, airport: string, weatherCity: string }
  route: string
  passengers: { name: string, seat: string }[]
  pdfPage: number
  bgBlur: string
  bgSharp: string
  flightModel: string
  terminal: string

}

const segments: Segment[] = [
  {
    label: 'LHR → SIN',
    airline: 'Singapore Airlines (SQ305)',
    cls: 'Economy (K)',
    duration: '13h 05m',
    depart: { time:'09:25', date:'Tue 19 Aug 2025', airport:'London Heathrow T2', weatherCity:'London' },
    arrive: { time:'05:30', date:'Wed 20 Aug 2025', airport:'Singapore Changi T2', weatherCity:'Singapore' },
    route: 'London → Singapore',
    passengers: [
      { name: 'Olamide Ogunlade', seat: '49K' },
      { name: 'Mariathan P. J. Fakondoh', seat: '49J' }
    ],
    pdfPage: 0,
    bgBlur:'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/29/d4/40/night-view-of-the-hsbc.jpg?w=900&h=500&s=1',
    bgSharp:'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/29/d4/40/night-view-of-the-hsbc.jpg?w=900&h=500&s=1',
    flightModel: 'Boeing 777-300ER',
    terminal: 'Terminal 2'
  },
  {
    label: 'SIN → DPS',
    airline: 'Singapore Airlines (SQ934)',
    cls: 'Economy (K)',
    duration: '2h 35m',
    depart: { time:'06:25', date:'Wed 20 Aug 2025', airport:'Singapore Changi T2', weatherCity:'Singapore' },
    arrive: { time:'09:00', date:'Wed 20 Aug 2025', airport:'Denpasar (Bali) T1', weatherCity:'Denpasar' },
    route: 'Singapore → Denpasar',
    passengers: [
      { name: 'Olamide Ogunlade', seat: '60J' },
      { name: 'Mariathan P. J. Fakondoh', seat: '60K' }
    ],
    pdfPage: 1,
    bgBlur:'https://vj-prod-website-cms.s3.ap-southeast-1.amazonaws.com/r1-1715754982308.jpg',
    bgSharp:'https://vj-prod-website-cms.s3.ap-southeast-1.amazonaws.com/r1-1715754982308.jpg',
    flightModel: 'Boeing 787-10',
    terminal: 'Terminal 2'
  },
  {
    label: 'DPS → SIN',
    airline: 'Singapore Airlines (SQ949)',
    cls: 'Economy (E)',
    duration: '2h 50m',
    depart: { time:'07:10', date:'Sat 30 Aug 2025', airport:'Denpasar (Bali) Intl', weatherCity:'Denpasar' },
    arrive: { time:'10:00', date:'Sat 30 Aug 2025', airport:'Singapore Changi T3', weatherCity:'Singapore' },
    route: 'Denpasar → Singapore',
    passengers: [
      { name: 'Olamide Ogunlade', seat: '—' },
      { name: 'Mariathan P. J. Fakondoh', seat: '—' }
    ],
    pdfPage: 2,
    bgBlur:'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/29/d4/40/night-view-of-the-hsbc.jpg?w=900&h=500&s=1',
    bgSharp:'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/29/d4/40/night-view-of-the-hsbc.jpg?w=900&h=500&s=1',
    flightModel: 'Boeing 787-10',
    terminal: 'Terminal Intl'

  },
  {
    label: 'SIN → LHR',
    airline: 'Singapore Airlines (SQ318)',
    cls: 'Economy (E)',
    duration: '13h 55m',
    depart: { time:'12:35', date:'Sat 30 Aug 2025', airport:'Singapore Changi T3', weatherCity:'Singapore' },
    arrive: { time:'19:30', date:'Sat 30 Aug 2025', airport:'London Heathrow T2', weatherCity:'London' },
    route: 'Singapore → London',
    passengers: [
      { name: 'Olamide Ogunlade', seat: '49J' },
      { name: 'Mariathan P. J. Fakondoh', seat: '49K' }
    ],
    pdfPage: 3,
    bgBlur:'https://www.macegroup.com/cdn-cgi/image/width=1120,height=480,quality=90,format=auto,gravity=0.5x0.5,fit=cover/globalassets/images/what-we-do/projects/heathrow/heathrow_t5_exterior_h.jpg',
    bgSharp:'https://www.macegroup.com/cdn-cgi/image/width=1120,height=480,quality=90,format=auto,gravity=0.5x0.5,fit=cover/globalassets/images/what-we-do/projects/heathrow/heathrow_t5_exterior_h.jpg',
    flightModel: 'Boeing 787-10',
    terminal: 'Terminal 3'
  }
]

export default function Tickets() {
  const [index, setIndex] = useState(0)
  const seg = segments[index]
  return (
    <div className="space-y-3">
      <Swiper onSlideChange={(s)=> setIndex(s.activeIndex)}>
        {segments.map((s, index) => (
        <SwiperSlide key={s.label}>
  {/* Destination-themed hero with blurred bg + crisp airplane window */}
  <div
    className="flight-window-wrap p-4 md:p-6 mb-4"
    style={{ /* background blur image (destination) */
      // @ts-ignore
      "--bg-url": `url(${s.bgBlur})`,
    } as React.CSSProperties}
  >
    <style>{`.flight-window-wrap::before { background-image: var(--bg-url); }`}</style>

    <div className="relative z-10 grid gap-6 md:grid-cols-[auto,1fr] items-center">
      {/* WINDOW */}
      <div className="flex justify-center">
        <div className="window-frame">
          <div className="window-rim"></div>
          <div className="window-view">
            {/* Sharp destination photo inside the window */}
            <img src={s.bgSharp} alt={`${s.arrive.airport} view`} />
          </div>
        </div>
      </div>

            {/* INFO COLUMN (hero text row you requested) */}
            <div className="text-white md:pl-4 justify-center items-center flex-col flex">
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span>Flight {index + 1}</span>
                <span>•</span>
                <span>{s.airline}</span>
              </div>

              <div className="mt-1 flex items-center gap-3">
                <div className="text-2xl md:text-3xl font-semibold">{s.label.split('→')?.[0]??""}</div>
                <svg width="28" height="28" viewBox="0 0 24 24" className="opacity-90">
                 <LucidePlane/>
                </svg>
                <div className="text-2xl md:text-3xl font-semibold">{s.label.split('→')?.[1]??""}</div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 flex-col items-center">
                <div className="bg-white/10 px-2.5 py-1 rounded-full text-xs text-center">{s.airline}</div>
                <div className="bg-white/10 px-2.5 py-1 rounded-full text-xs text-center w-fit">{s.flightModel}</div>
                {/* <div className="bg-white/10 px-2.5 py-1 rounded-full text-xs">{s.cabin}</div> */}
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS + PASSENGERS (kept, just placed under the hero) */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* FLIGHT DETAILS CARD (unchanged logic, simplified look) */}
          <div className="md:col-span-2">
          <Card>
                  <Typography level="title-md" startDecorator={<Plane size={16}/>}>{s.airline}</Typography>
                  <Chip size="sm" variant="soft">{s.cls}</Chip>
                  <div className="mt-2 text-sm"><div className="flex items-center gap-2"><Clock size={14}/> Duration: {s.duration}</div></div>

                  <div className="mt-2 flex gap-2 flex-wrap">
                    <WeatherChip city={s.depart.weatherCity} />
                    <WeatherChip city={s.arrive.weatherCity} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Sheet variant="soft" sx={{p:1.5, borderRadius:'md'}}>
                      <div className="font-semibold">{s.depart.time}</div>
                      <div>{s.depart.date}</div>
                      <div className="text-xs opacity-70">{s.depart.airport}</div>
                    </Sheet>
                    <Sheet variant="soft" sx={{p:1.5, borderRadius:'md'}}>
                      <div className="font-semibold">{s.arrive.time}</div>
                      <div>{s.arrive.date}</div>
                      <div className="text-xs opacity-70">{s.arrive.airport}</div>
                    </Sheet>
                  </div>
                  <div className="mt-1 text-xs opacity-70">{s.route}</div>
                  <Button sx={{mt:1}} startDecorator={<Download size={16}/>} component="a" href="/docs/5RX22O_tickets_receipts.pdf" download>
                    Download full ticket
                  </Button>
                </Card>
          </div>

          {/* PASSENGERS CARD (unchanged) */}
          <div>
            <Card>
              <Typography level="title-sm" startDecorator={<User2 size={16}/>}>Passengers</Typography>
              <ul className="mt-2 space-y-1 text-sm">
                {s.passengers.map((p)=> (
                  <li key={p.name} className="flex justify-between">
                    <span>{p.name}</span><span>Seat {p.seat}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </SwiperSlide>
        ))}
      </Swiper>

      <Typography level="body-sm" color="neutral">Swipe between flights. The PDF page matches each flight’s center table.</Typography>
    </div>
  )
}
