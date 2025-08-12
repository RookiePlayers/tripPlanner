// components/ActivityCover.tsx
import * as React from 'react'
import Skeleton from '@mui/joy/Skeleton'

// Your Unsplash hook (or API fetch)
import { useUnsplash } from '../lib/hooks/useUnsplash'

export function ActivityCover({ query, fallback }: { query: string; fallback?: string }) {
  const { image } = useUnsplash(query, { orientation: 'landscape' })
  const src = image?.urls?.small || fallback

  if (!src) {
    return <Skeleton variant="rectangular" sx={{ height: 120 }} />
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={query} loading="lazy" style={{ height: 120, width: '100%', objectFit: 'cover' }} />
}


export function LazyActivityCover({ query, fallback }: { query: string; fallback?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ width: '100%' }}>
      {isVisible ? (
        <ActivityCover query={query} fallback={fallback} />
      ) : (
        <Skeleton variant="rectangular" sx={{ height: 120 }} />
      )}
    </div>
  )
}