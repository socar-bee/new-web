'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { addRecentParking } from '@/shared/hooks/useRecentParkings'

import { useParkingLotDetail, useTicketList } from '../model'
import type { ParkingLotDetail, ParkingLotType } from '@/shared/types/parking'

import { usePlatform } from '@/shared/platform'

export type DetailTabKey = 'tickets' | 'info' | 'recommend' | 'nearby'

export const DETAIL_TABS: { key: DetailTabKey; label: string }[] = [
  { key: 'tickets', label: '주차권' },
  { key: 'info', label: '정보' },
  { key: 'recommend', label: '추천' },
  { key: 'nearby', label: '주변' }
]

export function useParkingDetailViewModel(seq: number | null, type?: ParkingLotType, initialDetail?: ParkingLotDetail) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = usePlatform()
  const [activeTab, setActiveTab] = useState<DetailTabKey>('tickets')

  const parkingDate = searchParams?.get('parkingDate') ?? undefined
  const durationId = searchParams?.get('durationId') ?? undefined

  const carryQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (parkingDate) p.set('parkingDate', parkingDate)
    if (durationId) p.set('durationId', durationId)
    const s = p.toString()
    return s ? `?${s}` : ''
  }, [parkingDate, durationId])

  const { data: detail, isLoading: isDetailLoading } = useParkingLotDetail(seq, type, initialDetail)

  // 상세 조회 성공 시 "최근 본 주차장" 기록 (홈 섹션용)
  useEffect(() => {
    if (!detail) return
    addRecentParking({
      seq: detail.seq,
      name: detail.basic.name,
      image: detail.basic.photos[0]?.thumbnail
    })
  }, [detail])
  const { data: tickets, isLoading: isTicketsLoading } = useTicketList(seq, parkingDate, durationId)

  /** 뒤로가기 — 웹은 지도 홈으로, 앱은 웹뷰 닫기 (platform 이 분기) */
  const goBack = useCallback(() => {
    platform.back('/')
  }, [platform])

  // 앱 웹뷰 네이티브 상단바 — 웹은 no-op (시트 내 NavigationBar 가 맡는다)
  platform.useTopBar({ title: detail?.basic.name ?? '주차장 상세', onBack: goBack })

  const isLoading = isDetailLoading || isTicketsLoading

  const copyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
    } catch {}
  }, [])

  /** 주차권 클릭 → 주차권 상세 페이지로 이동 (결제는 상세에서 분기) */
  const goToTicketDetail = useCallback(
    (couponSeq: number) => {
      router.push(`/t/${couponSeq}${carryQuery}`)
    },
    [router, carryQuery]
  )

  /** 현장 요금 포맷: calcPrices에서 60분(1시간) 기준 찾거나 첫 항목 사용 */
  const formatCurrentFee = useCallback((calcPrices: Record<string, number>) => {
    const entries = Object.entries(calcPrices)
    if (!entries.length) return null
    const hourEntry = entries.find(([k]) => Number(k) === 60)
    if (hourEntry) return `1시간 기준 ${hourEntry[1].toLocaleString()}원`
    const [key, val] = entries[0]
    const mins = Number(key)
    return mins >= 60 ? `${mins / 60}시간 기준 ${val.toLocaleString()}원` : `${mins}분 기준 ${val.toLocaleString()}원`
  }, [])

  return {
    detail,
    tickets: tickets ?? [],
    isLoading,
    activeTab,
    setActiveTab,
    copyAddress,
    goBack,
    goToTicketDetail,
    formatCurrentFee
  }
}
