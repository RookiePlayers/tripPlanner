'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useUnsplash(query: string, options?: { orientation?: 'landscape'|'portrait'|'squarish' }) {
  const q = query?.trim() || 'Bali'
  const params = new URLSearchParams({ q, orientation: options?.orientation || 'landscape' })
  const { data, error, isLoading } = useSWR(`/api/unsplash?${params.toString()}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
  return {
    image: data?.image as (null | {
      id: string
      alt: string
      urls: { thumb: string; small: string; regular: string; full: string }
      credit: { authorName: string; authorLink: string; unsplashLink: string }
    }),
    isLoading,
    error,
  }
}