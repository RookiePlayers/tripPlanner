export type ActivityItem = {
  name: string
  startTimeISO?: string | null
  endTimeISO?: string | null
  startTimeDisplay?: string | null
  endTimeDisplay?: string | null
  zone?: string
  category?: string
  booked?: boolean
  paid?: boolean
  price?: number | string
  location?: string
  ticketUrl?: string
  tiktokUrl?: string
}

export type DayData = {
  dayNumber: number
  dateISO?: string | null
  headerImage?: string | null
  items: ActivityItem[]
}

export type ActivitiesData = { days: DayData[] }

export type RestaurantItem = {
  name: string
  timeText?: string            // optional opening hours text or time string
  price?: number | string
  cuisine?: string             // select or text
  meal?: string                // Breakfast/Lunch/Dinner etc
  location?: string            // address / plus code / GMaps query
  zone?: string                // optional grouping
  menuUrl?: string             // pdf/image/url
  tiktokUrl?: string
}

export type RestaurantsResponse = {
  items: RestaurantItem[]
}

export type DocumentRow = {
  id: string
  name: string
  type?: string | null
  person?: string | null
  personAvatar?: string | null // ✅ New

  status?: string | null
  dateAssigned?: string | null  // ISO (yyyy-mm-dd)
  dateExpiring?: string | null  // ISO (yyyy-mm-dd)
  paid?: boolean
  // If Notion is hosting files, we return stable proxy URLs that won't expire
  files: { name?: string; url: string }[]
}
