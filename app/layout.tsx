'use client'
import './globals.css'
import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CssVarsProvider, extendTheme, useColorScheme,
  Sheet, Box, IconButton, Typography, Button, List, ListItemButton
} from '@mui/joy'
import {
  Home, Plane, Ticket, ShieldCheck, BedDouble, Map as MapIcon, Wallet, Sun, Moon
} from 'lucide-react'
import { GateProvider } from '../components/PasswordGate'

// ---------------- Theme ----------------
const theme = extendTheme({
  colorSchemes: {
    light: { palette: { primary: { solidBg: 'var(--brand-1)' } } },
    dark:  { palette: { primary: { solidBg: 'var(--brand-2)' } } }
  },
  fontFamily: { body: 'Inter, ui-sans-serif, system-ui' }
})

function ThemeToggle(){
  const { mode, setMode } = useColorScheme()
  return (
    <IconButton variant="soft" onClick={()=> setMode(mode === 'dark' ? 'light' : 'dark')}>
      {mode==='dark'? <Sun size={18}/> : <Moon size={18}/>}
    </IconButton>
  )
}

// ---------------- Sky Parallax ----------------
function SkyParallax(){
  const ref = React.useRef<HTMLDivElement>(null)

  const computePhase = React.useCallback(() => {
    const now = new Date()
    const hourStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Makassar', hour: '2-digit', hour12: false
    }).format(now)
    const h = parseInt(hourStr, 10)
    if (h >= 5 && h <= 6) {
      return { top:'#F9D1FF', mid:'#FFD9A8', bottom:'#B8E7FF', clouds: 0.55, stars: 0 }
    } else if (h >= 7 && h <= 16) {
      return { top:'#8FD3FF', mid:'#BFE7FF', bottom:'#EAF6FF', clouds: 0.6, stars: 0 }
    } else if (h >= 17 && h <= 18) {
      return { top:'#FFB3A6', mid:'#DCABDF', bottom:'#4B6CB7', clouds: 0.5, stars: 0.1 }
    } else {
      return { top:'#0B1022', mid:'#141B3A', bottom:'#2A2E52', clouds: 0.1, stars: 0.6 }
    }
  }, [])

  const [vars, setVars] = React.useState(() => computePhase())

  React.useEffect(() => {
    setVars(computePhase())
    const t = setInterval(() => setVars(computePhase()), 60_000)
    return () => clearInterval(t)
  }, [computePhase])

  React.useEffect(() => {
    let ticking = false
    const strength = 0.12
    const max = 120
    const update = () => {
      const y = Math.min(window.scrollY * strength, max)
      if (ref.current) ref.current.style.setProperty('--parallaxY', `${y}px`)
      ticking = false
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={ref}
      className="sky"
      style={{
        // @ts-ignore
        '--sky-top': vars.top, '--sky-mid': vars.mid, '--sky-bottom': vars.bottom,
        '--stars-opacity': String(vars.stars), '--clouds-opacity': String(vars.clouds),
        '--sky-angle': '180deg',
      } as React.CSSProperties}
    >
      <div className="clouds" />
      <div className="stars" />
    </div>
  )
}

// ---------------- Nav Model ----------------
const nav = [
  { href: '/',            label: 'Welcome',       icon: <Home size={18}/> },
  { href: '/flights',     label: 'Flights',       icon: <Plane size={18}/> },
  { href: '/tickets',     label: 'Tickets',       icon: <Ticket size={18}/> },
  { href: '/documents',        label: 'Documents',icon: <ShieldCheck size={18}/> },
  { href: '/accommodation', label: 'Stay',        icon: <BedDouble size={18}/> },
  { href: '/activities',  label: 'Activities',    icon: <MapIcon size={18}/> },
  { href: '/payments',    label: 'Payments',      icon: <Wallet size={18}/> },
]

function titleFromPath(pathname: string) {
  const found = nav.find(n => n.href === pathname)
  if (found) return found.label
  // fallback: prettify last segment
  const seg = pathname.split('/').filter(Boolean).pop() || 'Welcome'
  return seg.charAt(0).toUpperCase() + seg.slice(1)
}

// tiny media hook
function useIsMobile() {
  const [mobile, setMobile] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const set = () => setMobile(mq.matches)
    set()
    mq.addEventListener?.('change', set)
    return () => mq.removeEventListener?.('change', set)
  }, [])
  return mobile
}

// ---------------- Layout ----------------
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const isMobile = useIsMobile()
  const pageTitle = titleFromPath(pathname)
  const secrets = {
    documents: process.env.NEXT_PUBLIC_DOCS_PASS, // .env.local
    payments: process.env.NEXT_PUBLIC_DOCS_PASS,   // optional
    tickets: process.env.NEXT_PUBLIC_DOCS_PASS,    // optional
  }

  // auto-center active btn in bottom strip
  const stripRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (!isMobile || !stripRef.current) return
    const btn = stripRef.current.querySelector('[aria-current="page"]') as HTMLElement | null
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [pathname, isMobile])

  return (
    <html lang="en">
      <body>
        <CssVarsProvider theme={theme} defaultMode="system">
          {/* Background */}

             <GateProvider secrets={secrets} remember>
          <SkyParallax />
          <div className="app-layer">
            {/* Header (desktop + mobile title) */}
            <Sheet
              variant="soft"
              sx={{
                position: 'sticky', top: 0, zIndex: 10,
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid', borderColor: 'divider'
              }}
              className="header-anim"
            >
              <Box
                sx={{
                  maxWidth: 1200, mx: 'auto', px: 1.5, py: 1,
                  display: 'flex', alignItems: 'center', gap: 1,
                }}
              >
                {/* Brand / Title */}
                <Typography level="title-lg" sx={{ flex: 1 }}>
                  {pageTitle}
                </Typography>

                <ThemeToggle/>
              </Box>

              {/* Desktop top nav */}
              {!isMobile && (
                <Box sx={{ maxWidth: 1200, mx: 'auto', px: 1.5, pb: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {nav.map(item => {
                    const active = pathname === item.href
                    return (
                      <Button
                        key={item.href}
                        component={Link}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        startDecorator={item.icon}
                        variant={active ? 'solid' : 'plain'}
                        color={active ? 'primary' : 'neutral'}
                        sx={{
                          borderRadius: 'lg',
                          px: 1.25,
                          ...(active
                            ? {
                                background:
                                  'linear-gradient(135deg, rgba(168,85,247,.18), rgba(234,179,8,.18))',
                                boxShadow:
                                  '0 6px 16px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.18)',
                                border: '1px solid',
                                borderColor: 'primary.outlinedBorder',
                                fontWeight: 700,
                              }
                            : {
                                border: '1px solid',
                                borderColor: 'divider',
                                fontWeight: 500,
                              })
                        }}
                      >
                        {item.label}
                      </Button>
                    )
                  })}
                </Box>
              )}
            </Sheet>

            {/* Page container */}
  
            <Box sx={{ maxWidth: 1200, mx:'auto', px: 1.5, py: 2, pb: isMobile ? 8.5 : 2 }}>
              {children}
            </Box>

            {/* Bottom Navigation for Mobile */}
            {isMobile && (
              <Sheet
                sx={{
                  position: 'fixed',
                  bottom: 0, left: 0, right: 0,
                  borderTop: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.surface',
                  p: 0.5,
                  zIndex: 20,
                  '@keyframes slideUp': {
                    from: { transform: 'translateY(110%)', opacity: 0 },
                    to:   { transform: 'translateY(0)',     opacity: 1 },
                  },
                  animation: 'slideUp 280ms ease-out',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box
                  ref={stripRef}
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    overflowX: 'auto',
                    px: 0.5,
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {nav.map((item) => {
                    const active = pathname === item.href
                    return (
                      <Button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        aria-current={active ? 'page' : undefined}
                        variant={active ? 'solid' : 'plain'}
                        color={active ? 'primary' : 'neutral'}
                        sx={{
                          flex: '0 0 auto',
                          minWidth: 88,
                          px: 1,
                          py: 0.75,
                          borderRadius: 'lg',
                          gap: 0.5,
                          scrollSnapAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          lineHeight: 1,
                          ...(active
                            ? {
                                background:
                                  'linear-gradient(135deg, rgba(168,85,247,.18), rgba(234,179,8,.18))',
                                boxShadow:
                                  '0 6px 16px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.18)',
                                border: '1px solid',
                                borderColor: 'primary.outlinedBorder',
                              }
                            : {
                                border: '1px solid',
                                borderColor: 'divider',
                              }),
                        }}
                      >
                        <Box sx={{ opacity: active ? 1 : 0.9, transform: active ? 'scale(1.05)' : 'none' }}>
                          {item.icon}
                        </Box>
                        <Typography
                          level="body-xs"
                          sx={{ mt: 0.25, fontWeight: active ? 700 : 500, opacity: active ? 1 : 0.9, whiteSpace: 'nowrap' }}
                        >
                          {item.label}
                        </Typography>
                      </Button>
                    )
                  })}
                </Box>
              </Sheet>
            )}
          </div>
          
          </GateProvider>
        </CssVarsProvider>
      </body>
    </html>
  )
}