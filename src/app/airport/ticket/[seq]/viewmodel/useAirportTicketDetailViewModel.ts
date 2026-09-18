'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import type { AirportTicketDetail } from '../../../model'

import { fetchAirportTicketDetail, parseAirportDateTime } from '../../../model'

import { usePlatform } from '@/shared/platform'

/** 안내 텍스트 → 줄 단위 불릿 (modu-web-app splitNoticeLines 대응) */
export function splitNoticeLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-•·]\s*/, '').trim())
    .filter(Boolean)
}

/**
 * 공항 주차권 상세 (modu-web-app /airport/ticket/[id] 기준).
 * 쿼리 sDate/eDate 는 목록 검색 조건 — 결제 payload 의 predict 시간으로 이어진다.
 */
export function useAirportTicketDetailViewModel(seq: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sDate = searchParams?.get('sDate') ?? ''
  const eDate = searchParams?.get('eDate') ?? ''

  const platform = usePlatform()

  const [detail, setDetail] = useState<AirportTicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sDate || !eDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false)
      return
    }
    let stale = false
    fetchAirportTicketDetail(seq, {
      predictBeginTime: parseAirportDateTime(sDate),
      predictExitBeginTime: parseAirportDateTime(eDate)
    })
      .then((data) => {
        if (!stale) setDetail(data)
      })
      .catch(() => {
        if (!stale) setDetail(null)
      })
      .finally(() => {
        if (!stale) setIsLoading(false)
      })
    return () => {
      stale = true
    }
  }, [seq, sDate, eDate])

  /** 총액 = 기본가 + addon 합 (모웹 표기와 동일하게 합산 노출) */
  const totalPrice = useMemo(() => {
    if (!detail) return 0
    return detail.basePrice + detail.addonPrice.reduce((sum, addon) => sum + addon.price, 0)
  }, [detail])

  /** "MM.dd(요일)~MM.dd(요일)" — 모웹 시안 표기 (물결 양옆 공백 없음) */
  const formattedDateRange = useMemo(() => {
    if (!sDate || !eDate) return ''
    const fmt = (value: string) => {
      const d = new Date(value)
      const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
      return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}(${day})`
    }
    return `${fmt(sDate)}~${fmt(eDate)}`
  }, [sDate, eDate])

  const cautionNotices = useMemo(() => splitNoticeLines(detail?.prePurchaseNotice ?? ''), [detail])
  const subNotices = useMemo(
    () => [...splitNoticeLines(detail?.postPurchaseNotice ?? ''), ...splitNoticeLines(detail?.notice ?? '')],
    [detail]
  )

  /** 구매 — pay 결제웹뷰(flowType=period)로 진입. 자체 결제 화면은 두지 않는다 (제휴와 동일 정책) */
  const startPurchase = () => {
    if (!detail || detail.isSoldOut) return
    void platform.startCheckout({
      flowType: 'period',
      couponSeq: detail.couponSeq,
      startDate: parseAirportDateTime(sDate).toISOString(),
      endDate: parseAirportDateTime(eDate).toISOString()
    })
  }

  return {
    detail,
    isLoading,
    sDate,
    eDate,
    totalPrice,
    formattedDateRange,
    cautionNotices,
    subNotices,
    startPurchase,
    goBack: () => router.back()
  }
}
