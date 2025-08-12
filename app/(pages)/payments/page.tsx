'use client'

import * as React from 'react'
import useSWR from 'swr'
import {
  Box, Card, Typography, Stack, Chip, Sheet, Divider, List, ListItem, ListItemDecorator, ListItemContent, Skeleton
} from '@mui/joy'
import { CreditCard, Utensils, Sigma, AlertTriangle } from 'lucide-react'

// ---- Types your APIs return ----
type ActivityItem = {
  name?: string
  paid?: boolean
  price?: number | string | null
}

type DayData = {
  dayNumber: number
  dayLabel?: string
  items: ActivityItem[]
}

type ActivitiesData = { days: DayData[] }

type Restaurant = {
  name: string
  price?: number | string | null
  // any one of these may exist depending on your route
  day?: number | string
  dayNumber?: number
  dayLabel?: string
}

type FoodData = { restaurants: Restaurant[] }

// ---- SWR fetcher ----
const fetcher = (u: string) => fetch(u).then(r => {
  if (!r.ok) throw new Error('Failed')
  return r.json()
})

// ---- helpers ----
const gbp = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n || 0)

function toNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  if (typeof val === 'string') {
    // Try numeric (strip commas/spaces)
    const t = val.replace(/[, ]/g, '')
    const n = Number(t.replace(/^£/, ''))
    if (!Number.isNaN(n)) return n
    // Map price bands
    const v = val.trim()
    if (v === '£') return 15
    if (v === '££') return 35
    if (v === '£££') return 70
  }
  return 0
}

function isDay2or5(r: Restaurant): boolean {
  // handle number or label or raw "Day X"
  const dNum =
    typeof r.day === 'number' ? r.day :
    typeof r.dayNumber === 'number' ? r.dayNumber :
    typeof r.day === 'string' && /(\d+)/.test(r.day) ? Number(RegExp.$1) :
    typeof r.dayLabel === 'string' && /(\d+)/.test(r.dayLabel) ? Number(RegExp.$1) :
    undefined
  return dNum === 2 || dNum === 5
}

// ---- Component ----
export default function PaymentTracker() {
  // NOTE: swap to your live endpoints if you want (e.g. /api/notion/activities)
  const { data: activities, isLoading: loadingAct, error: errAct } =
    useSWR<ActivitiesData>('/api/notion/activities', fetcher)

  const { data: food, isLoading: loadingFood, error: errFood } =
    useSWR<FoodData>('/api/notion/restaurants', fetcher)

  // sums
  const activityUnpaid = React.useMemo(() => {
    if (!activities?.days?.length) return 0
    let total = 0
    for (const d of activities.days) {
      for (const i of d.items) {
        if (!i?.paid) total += toNumber(i.price)
      }
    }
    return total
  }, [activities])

  const foodIncluded = React.useMemo(() => {
    if (!food?.restaurants?.length) return 0
    return food.restaurants
      .filter(r => !isDay2or5(r))
      .reduce((acc, r) => acc + toNumber(r.price), 0)
  }, [food])

  const grandTotal = activityUnpaid + foodIncluded

  const loading = loadingAct || loadingFood
  const errored = errAct || errFood

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
    

      {/* Summary cards */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.2}
        sx={{ mb: 1.5 }}
      >
        <SummaryCard
          icon={<CreditCard size={18} />}
          label="Activities (unpaid)"
          value={activityUnpaid}
          loading={loading}
          gradient="linear-gradient(135deg, var(--joy-palette-primary-600), var(--joy-palette-primary-400))"
        />
        <SummaryCard
          icon={<Utensils size={18} />}
          label="Food (excl. Day 2 & 5)"
          value={foodIncluded}
          loading={loading}
          gradient="linear-gradient(135deg, var(--joy-palette-success-600), var(--joy-palette-success-400))"
        />
        <SummaryCard
          icon={<Sigma size={18} />}
          label="Total"
          value={grandTotal}
          loading={loading}
          gradient="linear-gradient(135deg, var(--joy-palette-warning-700), var(--joy-palette-warning-400))"
        />
      </Stack>

      {errored && (
        <Sheet
          variant="soft"
          color="danger"
          sx={{ p: 1.25, borderRadius: 'md', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
        >
          <AlertTriangle size={18} />
          <Typography level="body-sm">Couldn’t load one or more sources.</Typography>
        </Sheet>
      )}

      {/* Breakdowns */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.2}
      >
        <Sheet variant="outlined" sx={{ p: 1.25, borderRadius: 'md', flex: 1, minHeight: 220 }}>
          <Typography level="title-sm" sx={{ mb: 0.75 }}>Unpaid activities</Typography>
          <Divider sx={{ mb: 1 }} />
          {loading ? (
            <SkeletonList count={4} />
          ) : (
            <List sx={{ m: 0, p: 0 }}>
              {activities?.days?.flatMap(d =>
                d.items
                  .filter(i => !i.paid && toNumber(i.price) > 0)
                  .map((i, idx) => (
                    <ListItem
                      key={`${d.dayNumber}-${idx}`}
                      sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemDecorator>
                        <Chip size="sm" variant="soft">Day {d.dayNumber}</Chip>
                      </ListItemDecorator>
                      <ListItemContent>
                        <Typography level="body-sm">{i.name || '(untitled)'}</Typography>
                      </ListItemContent>
                      <Chip size="sm" variant="outlined">{gbp(toNumber(i.price))}</Chip>
                    </ListItem>
                  ))
              ) || (
                <Typography level="body-xs" sx={{ opacity: 0.75 }}>No unpaid items 🎉</Typography>
              )}
            </List>
          )}
        </Sheet>

        <Sheet variant="outlined" sx={{ p: 1.25, borderRadius: 'md', flex: 1, minHeight: 220 }}>
          <Typography level="title-sm" sx={{ mb: 0.75 }}>Food included (excl. Day 2 & 5)</Typography>
          <Divider sx={{ mb: 1 }} />
          {loading ? (
            <SkeletonList count={4} />
          ) : (
            <List sx={{ m: 0, p: 0 }}>
              {food?.restaurants
                ?.filter(r => !isDay2or5(r))
                .filter(r => toNumber(r.price) > 0)
                .slice(0, 20)
                .map((r, idx) => (
                  <ListItem
                    key={`${r.name}-${idx}`}
                    sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <ListItemDecorator>
                      <DayPill restaurant={r} />
                    </ListItemDecorator>
                    <ListItemContent>
                      <Typography level="body-sm">{r.name}</Typography>
                    </ListItemContent>
                    <Chip size="sm" variant="outlined">{gbp(toNumber(r.price))}</Chip>
                  </ListItem>
                ))}
              {!food?.restaurants?.length && (
                <Typography level="body-xs" sx={{ opacity: 0.75 }}>No restaurants.</Typography>
              )}
            </List>
          )}
        </Sheet>
      </Stack>
    </Box>
  )
}

// ---- UI bits ----

function SummaryCard({
  icon, label, value, loading, gradient
}: { icon: React.ReactNode; label: string; value: number; loading: boolean; gradient: string }) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        p: 1.25,
        borderRadius: 'lg',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: gradient,
          opacity: 0.15,
          pointerEvents: 'none'
        }
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip size="sm" variant="soft">{icon}</Chip>
        <Typography level="body-sm" sx={{ opacity: 0.8 }}>{label}</Typography>
      </Stack>
      <Box sx={{ mt: 0.75 }}>
        {loading ? (
          <Skeleton variant="text" level="h3" sx={{ width: 140 }} />
        ) : (
          <Typography level="h3">{gbp(value)}</Typography>
        )}
      </Box>
    </Card>
  )
}

function DayPill({ restaurant }: { restaurant: Restaurant }) {
  // display best-guess day label
  let label: string | undefined
  if (typeof restaurant.dayNumber === 'number') label = `Day ${restaurant.dayNumber}`
  else if (typeof restaurant.day === 'number') label = `Day ${restaurant.day}`
  else if (typeof restaurant.dayLabel === 'string') label = restaurant.dayLabel
  else if (typeof restaurant.day === 'string') label = restaurant.day
  return <Chip size="sm" variant="soft">{label || '—'}</Chip>
}

function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <Stack spacing={0.75}>
      {Array.from({ length: count }).map((_, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center">
          <Skeleton variant="rectangular" sx={{ width: 56, height: 20, borderRadius: 999 }} />
          <Skeleton variant="text" level="body-sm" sx={{ flex: 1 }} />
          <Skeleton variant="rectangular" sx={{ width: 70, height: 22, borderRadius: 8 }} />
        </Stack>
      ))}
    </Stack>
  )
}