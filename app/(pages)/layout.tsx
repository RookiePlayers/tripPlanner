export const metadata = {
  title: 'Travpal',
  description: 'Travpal helps you organize flights, tickets, accommodation, activities, and trip documents in one place.',
}

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
