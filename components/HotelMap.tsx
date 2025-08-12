import { Card, Typography, Grid, Button, Sheet, useTheme, AspectRatio } from '@mui/joy'
export function HotelMap({ address }: { address: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
  return (
    <AspectRatio ratio="16/9" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
      <iframe
        src={src}
        style={{ border: 0 }}
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </AspectRatio>
  )
}