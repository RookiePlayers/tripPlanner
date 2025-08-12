'use client'
import * as React from 'react'
import {
  Card, Typography, Grid, Button, Sheet, List, ListItem, ListItemDecorator,
  AspectRatio, Stack, Chip, Box,
  CardCover
} from '@mui/joy'
import { MapPin, Phone, MessageCircle, Wifi, Wind, Waves, Utensils } from 'lucide-react'
import { HOTEL_ADDRESS, mapsLinkFromQuery } from '../../../lib/utils'
import useSWR from 'swr'
import AccommodationGallery, { AccommodationGalleryRef } from '../../../components/Gallery'
import { motion } from 'motion/react'
import { HotelMap } from '../../../components/HotelMap'
import Image from 'next/image'


const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Accommodation() {
     const galleryRef = React.useRef<AccommodationGalleryRef>(null)
  const { data: accom, error: accomErr } = useSWR('/api/notion/photos', fetcher)
  const photos: string[] = accom?.images || []
  return (
    <>
    <Stack spacing={2}>

      {/* Villa / Address */}
      <Card variant="soft">
        <Stack spacing={1}>
          <Typography level="title-lg" startDecorator={<MapPin size={18}/>}>
           {accom?.name ?? " Your Villa"}
          </Typography>
          <Typography level="body-sm" sx={{ opacity: 0.85 }}>
            {accom?.address ?? HOTEL_ADDRESS}
          </Typography>
          {/* Inline map preview (no API key required) */}
          <AspectRatio ratio="16/9" sx={{ mt: 1, borderRadius: 'md', overflow: 'hidden' }}>
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(HOTEL_ADDRESS)}&output=embed`}
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </AspectRatio>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
            <Button
              component="a"
              target="_blank"
              rel="noopener noreferrer"
              href={mapsLinkFromQuery(HOTEL_ADDRESS)}
            >
              Open in Google Maps
            </Button>
            <Button
              variant="soft"
              component="a"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(HOTEL_ADDRESS)}`}
            >
              Get Directions
            </Button>
          </Stack>
        </Stack>
      </Card>

         <Card sx={{overflow: 'hidden', paddingInline: 'sm'}}>
        <Grid container spacing={1} alignItems="center">
          <Grid xs={12} >
            <Typography level="title-md" sx={{ mt: 2, mb: 1 }}>Photos</Typography>

            {!accom && !accomErr && <Typography level="body-sm">Loading photos…</Typography>}
            {accomErr && <Typography level="body-sm" color="danger">Couldn’t load photos from Notion.</Typography>}
            </Grid>
            {photos?.length > 0 && (
              
                photos.map((src, index) => (
                  <Grid key={src} xs={6} md={3} alignItems="center" justifyContent="center" alignSelf="center" alignContent="center">
                      <motion.div whileHover={{ scale: 1.05, cursor: 'pointer', }} whileTap={{ scale: 0.95 }} onClick={() => galleryRef.current?.open(photos.map((photo) => ({ url: photo })), index)}>
                        <Card sx={{ minHeight: 250,  }}>
                          <CardCover sx={{ borderRadius: 'md', overflow: 'hidden', cursor: 'pointer' }}>
                              <Image fill objectFit='cover' src={src} alt="Accommodation" loading="lazy" />
                          </CardCover>

                        </Card>
                      </motion.div>
                  </Grid>
                ))
              
            )}
            
        </Grid>
      </Card>

      <Grid container spacing={2}>
        {/* Amenities */}
        <Grid xs={12} md={4}>
          <Card variant="outlined">
            <Typography level="title-md">Amenities</Typography>
            <List size="sm" sx={{ mt: 1 }}>
              <ListItem>
                <ListItemDecorator><Wifi size={16}/></ListItemDecorator> Wi-Fi
              </ListItem>
              <ListItem>
                <ListItemDecorator><Wind size={16}/></ListItemDecorator> Air Conditioning
              </ListItem>
              <ListItem>
                <ListItemDecorator><Waves size={16}/></ListItemDecorator> Pool
              </ListItem>
              <ListItem>
                <ListItemDecorator>🍳</ListItemDecorator> Kitchenette
              </ListItem>
              <ListItem>
                <ListItemDecorator>🧺</ListItemDecorator> Laundry Service
              </ListItem>
            </List>
            <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip size="sm" variant="soft">Towels</Chip>
              <Chip size="sm" variant="soft">Safe</Chip>
              <Chip size="sm" variant="soft">TV</Chip>
            </Box>
          </Card>
        </Grid>

        {/* Food Vendors Nearby */}
        <Grid xs={12} md={4}>
          <Card variant="outlined">
            <Typography level="title-md" startDecorator={<Utensils size={16}/>}>
              Food Vendors Nearby
            </Typography>
            <List size="sm" sx={{ mt: 1 }}>
              <ListItem>Warung Eny</ListItem>
              <ListItem>La Favela</ListItem>
              <ListItem>Sea Circus</ListItem>
            </List>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
              <Button
                size="sm"
                variant="soft"
                component="a"
                target="_blank"
                href="https://www.google.com/maps/search/?api=1&query=restaurants+near+Jalan+Wirasaba+No+5+Seminyak+Bali+80361"
              >
                View on Maps
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* Virtual Waiter */}
        <Grid xs={12} md={4}>
          <Card variant="outlined">
            <Typography level="title-md">Virtual Waiter</Typography>
            <Typography level="body-sm" sx={{ opacity: 0.85, mt: 0.5 }}>
              Need something from reception?
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
              <Button
                startDecorator={<Phone size={16}/>}
                component="a"
                href="tel:+62XXXXXXXXX"
              >
                Call
              </Button>
              <Button
                variant="soft"
                startDecorator={<MessageCircle size={16}/>}
                component="a"
                target="_blank"
                rel="noopener noreferrer"
                href="https://wa.me/62XXXXXXXXX"
              >
                WhatsApp
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Stack>
      <AccommodationGallery ref={galleryRef} />
    </>
  )
}