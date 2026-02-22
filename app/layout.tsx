import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Travpal | Trip Planner',
  description:
    'Travpal helps you organize flights, tickets, accommodation, activities, and trip documents in one place.',
  keywords: [
    'trip planner',
    'travel planner',
    'itinerary',
    'flights',
    'accommodation',
    'activities',
    'documents',
  ],
  robots: {
    index: true,
    follow: true,
  },
  themeColor: '#0B1022',
  manifest: '/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Travpal',
  },
  openGraph: {
    type: 'website',
    siteName: 'Travpal',
    title: 'Travpal | Trip Planner',
    description:
      'Plan your trip with flights, tickets, accommodation, activities, and travel documents in one app.',
    images: [{ url: '/app_logo/travpal.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travpal | Trip Planner',
    description:
      'Plan your trip with flights, tickets, accommodation, activities, and travel documents in one app.',
    images: ['/app_logo/travpal.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
