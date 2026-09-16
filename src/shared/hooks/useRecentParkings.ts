'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'modu_recent_parkings'
const MAX_ITEMS = 10

export interface RecentParking {
  seq: number
  name: string
  image?: string
  /** 마지막 조회 시각 (정렬용 ms epoch) */
  viewedAt: number
}

function read(): RecentParking[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentParking[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 주차장 상세 조회 시 호출 — 같은 seq 는 최신으로 끌어올린다 */
export function addRecentParking(parking: Omit<RecentParking, 'viewedAt'>) {
  try {
    const items = read().filter((p) => p.seq !== parking.seq)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ ...parking, viewedAt: Date.now() }, ...items].slice(0, MAX_ITEMS))
    )
  } catch {}
}

/** SSR/hydration 안전: 마운트 후 localStorage 읽음 */
export function useRecentParkings() {
  const [parkings, setParkings] = useState<RecentParking[]>([])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParkings(read())
  }, [])

  return { parkings }
}
