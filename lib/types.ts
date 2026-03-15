export type ActivityItem = {
  name: string
  time: string // HH:mm
  zone?: string
  category?: string
  booked?: boolean
  paid?: boolean
  price?: number
  location?: string // address or plus code
  ticket?: string | null // path to PDF or image
  tiktok?: string | null // url
}

export type ActivityDay = {
  date: string // YYYY-MM-DD
  dayNumber: number
  headerImage?: string
  items: ActivityItem[]
}

export type ActivitiesData = {
  days: ActivityDay[]
}

export type Restaurant = {
  name: string
  link?: string
  tiktokUrl?: string
  startTimeISO?: string | null
  endTimeISO?: string | null
  timeDisplay?: string | null
  price?: number | string | null
  deposit?: number | string | null
  location?: string | null
  rank?: number | null
  zone?: string | null
  distance?: number | null
  cuisine?: string | null
  meal?: string | null
  area?: string | null
  menuFiles?: { url: string; name?: string }[]
}

export type FoodData = {
  restaurants: Restaurant[]
}

