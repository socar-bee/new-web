'use client'

import { useCallback, useMemo } from 'react'
import { useEffect } from 'react'

import { addRecentParking } from '@/shared/hooks/useRecentParkings'

import { useSharedParkingLotDetail } from '../model'
import type { SharedParkingLotDetail } from '@/shared/types/parking'

import { usePlatform } from '@/shared/platform'

export function useSharedDetailViewModel(seq: number | null, initialDetail?: SharedParkingLotDetail) {
  const platform = usePlatform()

  const { data: detail, isLoading } = useSharedParkingLotDetail(seq, initialDetail)

  // 상세 조회 성공 시 "최근 본 주차장" 기록 (홈 섹션용)
  useEffect(() => {
    if (!detail) return
    addRecentParking({
      seq: detail.seq,
      name: detail.basic.name,
      image: detail.basic.photos[0]?.thumbnail
    })
  }, [detail])

  /** 뒤로가기 — 웹은 지도 홈으로, 앱은 웹뷰 닫기 (platform 이 분기) */
  const goBack = useCallback(() => {
    platform.back('/')
  }, [platform])

  // 앱 웹뷰 네이티브 상단바 — 웹은 no-op (시트 내 NavigationBar 가 맡는다)
  platform.useTopBar({ title: detail?.basic.name ?? '공유주차장 상세', onBack: goBack })

  /** 60분 기준 요금 (calcPrices['60']) — 없으면 첫 항목 기준으로 환산 */
  const hourlyFeeLabel = useMemo(() => {
    const calcPrices = detail?.basic.calcPrices
    if (!calcPrices) return null
    const entries = Object.entries(calcPrices)
    if (!entries.length) return null
    const hourEntry = entries.find(([k]) => Number(k) === 60)
    if (hourEntry) return `1시간 기준 ${hourEntry[1].toLocaleString()}원`
    const [key, val] = entries[0]
    const mins = Number(key)
    return mins >= 60 ? `${mins / 60}시간 기준 ${val.toLocaleString()}원` : `${mins}분 기준 ${val.toLocaleString()}원`
  }, [detail])

  /** 운영 시간 — modu-web-app /s 규칙: 일요일이 맨 앞이면 맨 뒤로 회전 */
  const operationTimeRows = useMemo(() => {
    const contents = detail?.times[0]?.contents ?? []
    if (!contents.length) return []
    if (contents[0]?.key === '일요일') {
      const [sunday, ...restDays] = contents
      return [...restDays, sunday]
    }
    return contents
  }, [detail])

  /** 요금 상세 rows — modu-web-app SharedParkinglotPriceInfoView 와 동일 슬라이스 */
  const priceRows = useMemo(() => detail?.prices[0]?.contents.slice(1, 2) ?? [], [detail])

  /** 주차 시작 — pay 결제웹뷰(flowType=share)로 진입. 자체 결제 화면은 두지 않는다 */
  const startPurchase = useCallback(() => {
    if (seq == null) return
    void platform.startCheckout({ flowType: 'share', shareSeq: seq })
  }, [platform, seq])

  return {
    detail,
    isLoading,
    goBack,
    startPurchase,
    hourlyFeeLabel,
    operationTimeRows,
    priceRows
  }
}
