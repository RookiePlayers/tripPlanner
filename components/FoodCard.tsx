'use client'
import * as React from 'react'
import useSWR from 'swr'
import {
  Sheet, Typography, Stack, Chip, Button, AspectRatio, Link as JoyLink, Skeleton,
  List, ListItem, ListItemDecorator, ListItemContent,
  Modal, ModalDialog, ModalClose
} from '@mui/joy' // ← added Modal, ModalDialog, ModalClose
import { MapPin, ExternalLink, Utensils, Video } from 'lucide-react'
import { mapsLinkFromQuery } from '../lib/utils'
import dynamic from 'next/dynamic'
import type { Restaurant } from '../lib/types'
import { useUnsplash } from '../lib/hooks/useUnsplash'
import { useGooglePlaces } from '../lib/hooks/useGooglePlaces'
const TicketPDFViewer = dynamic(()=> import('./TicketPDFViewer'), { ssr:false })

const fetcher = (u:string)=> fetch(u).then(r=>r.json())

export default function FoodNear({ near, zone, dayLabel }: { near?: string; zone?: string; dayLabel?: string }) {
  const qs = React.useMemo(() => {
    const p = new URLSearchParams()
    if (near) p.set('near', near)
    if (zone) p.set('zone', zone)
    if (dayLabel) p.set('day', dayLabel)
    return p.toString()
  }, [near, zone, dayLabel])

  const { data, isLoading, error } = useSWR<{restaurants: Restaurant[]}>(
    `/api/notion/restaurants?${qs}`,
    fetcher
  )

  return (
    <Sheet variant="outlined" sx={{ p: 1.5, borderRadius: 'md' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Utensils size={16} aria-hidden />
        <Typography level="title-sm">Food near this activity</Typography>
      </Stack>

      {isLoading && (
        <Stack spacing={1}>
          {Array.from({length:3}).map((_,i)=>(
            <Skeleton key={i} variant="rectangular" sx={{ height: 72, borderRadius: 'md' }}/>
          ))}
        </Stack>
      )}

      {error && <Typography level="body-xs" color="danger">Couldn’t load restaurants.</Typography>}

      {data?.restaurants?.length ? (
        <List sx={{ p: 1, m: 0 }}>
          {data.restaurants.slice(0,4).map((r, idx)=> (
            <FoodItem key={`${r.name}-${idx}`} r={r} />
          ))}
        </List>
      ) : (!isLoading && !error) ? (
        <Typography level="body-xs" sx={{ opacity: 0.75 }}>No nearby restaurants found.</Typography>
      ) : null}
    </Sheet>
  )
}

function FoodItem({ r }: { r: Restaurant }) {
  const { data: place } = useGooglePlaces(r.name, r.location ?? '')
  const { image: fallback } = useUnsplash(r.name, { orientation: 'landscape' })

  // modal state
  const [open, setOpen] = React.useState(false)

  const hasMenu = !!r.menuFiles?.length
  const heroSrc = place?.photoUrl ?? fallback?.urls?.small ?? ''

  return (
    <ListItem
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 'md',
        overflow: 'hidden',
        mb: 1
      }}
    >
      <ListItemDecorator sx={{ mr: 2, minWidth: 120 }}>
        {heroSrc ? (
          <AspectRatio ratio="4/3" sx={{ borderRadius: 'sm', overflow: 'hidden', width: 120 }}>
            <img src={heroSrc} alt={r.name} loading="lazy" />
          </AspectRatio>
        ) : (
          <Skeleton variant="rectangular" sx={{ width: 120, height: 90, borderRadius: 'sm' }} />
        )}
      </ListItemDecorator>

      <ListItemContent>
        <Typography level="title-sm">{r.name}</Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
          {r.meal && <Chip size="sm" variant="soft">{r.meal}</Chip>}
          {r.cuisine && <Chip size="sm" variant="soft">{r.cuisine}</Chip>}
          {typeof r.price !== 'undefined' && r.price !== null && (
            <Chip size="sm" variant="soft">
              {typeof r.price === 'number' ? `£${r.price.toFixed(2)}` : r.price}
            </Chip>
          )}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
          {r.location && (
            <Button size="sm" variant="soft" startDecorator={<MapPin size={16}/>}
              component={JoyLink} target="_blank" rel="noopener noreferrer"
              href={mapsLinkFromQuery(r.location)}
            >
              Maps
            </Button>
          )}
          {r.link && (
            <Button size="sm" variant="soft" startDecorator={<ExternalLink size={16}/>}
              component={JoyLink} target="_blank" rel="noopener noreferrer" href={r.link}>
              Website
            </Button>
          )}
          {r.tiktokUrl && (
            <Button size="sm" variant="soft" startDecorator={<Video size={16}/>}
              component={JoyLink} target="_blank" rel="noopener noreferrer" href={r.tiktokUrl}>
              TikTok — {r.name}
            </Button>
          )}
          {hasMenu && (
            <Button
              size="sm"
              variant="solid"
              onClick={() => setOpen(true)}
              sx={{ ml: 'auto' }}
            >
              Menu
            </Button>
          )}
        </Stack>

        {/* Menu modal */}
        <Modal open={open} onClose={() => setOpen(false)}>
          <ModalDialog
            sx={{
              width: { xs: '95vw', sm: 720 },
              maxWidth: '100%',
              p: 2,
            }}
          >
            <ModalClose />
            <Typography level="title-md" sx={{ mb: 1 }}>
              {r.name} — Menu
            </Typography>

            {r.menuFiles?.map((f, i) => {
              const isPdf = /\.pdf(\?|$)/i.test(f.url)
              return isPdf ? (
                <TicketPDFViewer key={i} url={f.url} />
              ) : (
                <AspectRatio key={i} ratio="16/9" variant="outlined" sx={{ borderRadius:'md', mb: 1 }}>
                  <img src={f.url} alt={f.name || `${r.name} menu`} loading="lazy" />
                </AspectRatio>
              )
            })}
          </ModalDialog>
        </Modal>
      </ListItemContent>
    </ListItem>
  )
}