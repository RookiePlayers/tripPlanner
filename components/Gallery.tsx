'use client'
import * as React from 'react'
import { Modal, ModalDialog, IconButton, Box, Typography } from '@mui/joy'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

export interface GalleryImage {
  url: string
  caption?: string
}

export interface AccommodationGalleryRef {
  /** Open with images and optional start index */
  open: (images: GalleryImage[], startIndex?: number) => void
  /** Programmatically jump to index */
  setIndex: (index: number) => void
  /** Next/Prev helpers */
  next: () => void
  prev: () => void
  /** Read current index */
  getIndex: () => number
  /** Close modal */
  close: () => void
}

const AccommodationGallery = React.forwardRef<AccommodationGalleryRef>((_, ref) => {
  const [images, setImages] = React.useState<GalleryImage[]>([])
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)

  // keep desired index until swiper is ready
  const desiredIndexRef = React.useRef<number | null>(null)
  const swiperRef = React.useRef<any>(null)

  // Methods exposed via ref
  React.useImperativeHandle(ref, () => ({
    open: (imgs, startIndex = 0) => {
      setImages(imgs)
      desiredIndexRef.current = Math.max(0, Math.min(startIndex, Math.max(0, imgs.length - 1)))
      setOpen(true)
    },
    setIndex: (index: number) => {
      const i = Math.max(0, Math.min(index, Math.max(0, images.length - 1)))
      if (swiperRef.current) {
        swiperRef.current.slideTo(i)
        setActiveIndex(i)
      } else {
        desiredIndexRef.current = i
      }
    },
    next: () => swiperRef.current?.slideNext(),
    prev: () => swiperRef.current?.slidePrev(),
    getIndex: () => activeIndex,
    close: () => setOpen(false),
  }), [images.length, activeIndex])

  // When modal opens and swiper attaches, honor desiredIndex
  React.useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      if (swiperRef.current && desiredIndexRef.current != null) {
        const i = desiredIndexRef.current
        swiperRef.current.slideTo(i)
        setActiveIndex(i)
        desiredIndexRef.current = null
      }
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  const handlePrev = () => {
    if (!images.length) return
    const next = activeIndex === 0 ? images.length - 1 : activeIndex - 1
    swiperRef.current?.slideTo(next)
    setActiveIndex(next)
  }

  const handleNext = () => {
    if (!images.length) return
    const next = activeIndex === images.length - 1 ? 0 : activeIndex + 1
    swiperRef.current?.slideTo(next)
    setActiveIndex(next)
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} sx={{ backdropFilter: 'blur(6px)' }}>
      <ModalDialog
        sx={{
          p: 0,
          maxWidth: '95vw',
          maxHeight: '95vh',
          overflow: 'hidden',
          borderRadius: 'md',
          bgcolor: 'neutral.900',
          color: '#fff',
        }}
      >
        {/* Close */}
        <IconButton
          onClick={() => setOpen(false)}
          variant="soft"
          color="neutral"
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
          aria-label="Close gallery"
        >
          <X />
        </IconButton>

        {/* Prev/Next */}
        {images.length > 1 && (
          <IconButton
            onClick={handlePrev}
            variant="soft"
            color="neutral"
            sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', zIndex: 10 }}
            aria-label="Previous image"
          >
            <ChevronLeft />
          </IconButton>
        )}
        {images.length > 1 && (
          <IconButton
            onClick={handleNext}
            variant="soft"
            color="neutral"
            sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', zIndex: 10 }}
            aria-label="Next image"
          >
            <ChevronRight />
          </IconButton>
        )}

        {/* Slides */}
        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          onSwiper={(inst) => (swiperRef.current = inst)}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          style={{ width: '100%', height: '100%' }}
        >
          {images.map((img, i) => (
            <SwiperSlide key={i}>
              <Box
                component="img"
                src={img.url}
                alt={img.caption || `Image ${i + 1}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#000',
                }}
              />
              {img.caption && (
                <Typography
                  level="body-sm"
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    background: 'rgba(0,0,0,0.5)',
                    p: 0.5,
                    borderRadius: 'sm',
                  }}
                >
                  {img.caption}
                </Typography>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </ModalDialog>
    </Modal>
  )
})

AccommodationGallery.displayName = 'AccommodationGallery'
export default AccommodationGallery