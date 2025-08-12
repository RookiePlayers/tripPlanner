"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useGooglePlaces(name?: string, location?: string) {
  const qs = new URLSearchParams();
  if (name) qs.set("name", name);
  if (location) qs.set("location", location);

  const key = name ? `/api/google-places?${qs.toString()}` : null;

  const { data, error, isLoading } = useSWR(key, fetcher, {
    dedupingInterval: 1000 * 60 * 60 * 24,  // 24h de-dupe
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });

  return { data, error, isLoading };
}