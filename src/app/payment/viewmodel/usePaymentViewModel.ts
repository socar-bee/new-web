'use client'

import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { resolveParkingDate } from '@/shared/lib/date'

import type { PayMethod } from '../model'
import { useAuthStore } from '@/shared/stores/authStore'

import { usePointBalance } from '../model'

import { useTicketDetail } from '@/app/t/[id]/model'
import { usePlatform } from '@/shared/platform'

export const PAYMENT_TITLE = '결제하기'

export function usePaymentViewModel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = usePlatform()
  const accessToken = useAuthStore((s) => s.accessToken)

  // ── 진입값 — 조회 키만 받는다. couponSeq 는 채울 값이 없어 없으면 무효다 (pay guestEntry 와 동일 규칙)
  const couponSeq = toPositiveInt(searchParams?.get('couponSeq'))
  const parkingDate = resolveParkingDate(searchParams?.get('parkingDate'))
  const isInvalidEntry = couponSeq == null

  // ── 상세 조회 — 화면 금액·상품명의 원본 (진입값에 금액을 싣지 않는다)
  const { data: ticket, isLoading } = useTicketDetail(couponSeq, parkingDate)

  // ── 뒤로가기 — 주차권 상세로 (앱은 웹뷰 닫기)
  const goBack = useCallback(() => {
    platform.back(couponSeq ? `/t/${couponSeq}?parkingDate=${parkingDate}` : '/')
  }, [platform, couponSeq, parkingDate])

  platform.useTopBar({ title: PAYMENT_TITLE, onBack: goBack })

  // ── 충전금 — 인증 수단이 있을 때만 조회, 실패는 0 (화면 진입은 막지 않는다)
  const { data: pointBalance = 0 } = usePointBalance({
    enabled: platform.kind === 'app' || !!accessToken,
    accessToken
  })

  const [point, setPoint] = useState(0)
  const [method, setMethod] = useState<PayMethod>('card')
  const [isPriceOpen, setIsPriceOpen] = useState(true)
  const [wantsReceipt, setWantsReceipt] = useState(false)

  const price = ticket?.price ?? 0
  const maxPoint = Math.min(pointBalance, price)
  const finalPrice = Math.max(0, price - point)

  const changePoint = useCallback(
    (value: number) => {
      setPoint(Math.max(0, Math.min(value, maxPoint)))
    },
    [maxPoint]
  )

  const useAllPoint = useCallback(() => setPoint(maxPoint), [maxPoint])

  /** 이용일 라벨 — `2026.09.16 (수)` */
  const parkingDateLabel = useMemo(() => {
    try {
      return format(parseISO(parkingDate), 'yyyy.MM.dd (EEE)', { locale: ko })
    } catch {
      return parkingDate
    }
  }, [parkingDate])

  /**
   * 결제 실행.
   *
   * TODO(구현): 결제 payload 계약 확정 후 실제 API 연결 —
   * `model/api.ts` 의 payByPoint(finalPrice 0)/payByBillkey(card)/payByWebview(naverpay·phone).
   * PG 웹뷰는 응답의 redirectUrl 로 이동하고, successUrl 이 /purchase/result 로 돌아온다.
   * 계약 확정 전 1차 구성: 완료 화면으로 연결해 플로우를 검증한다.
   */
  const handlePay = useCallback(() => {
    if (!ticket) return
    router.replace(`/purchase/result?couponSeq=${ticket.couponSeq}&parkingDate=${parkingDate}`)
  }, [router, ticket, parkingDate])

  return {
    isInvalidEntry,
    isLoading,
    ticket,
    parkingDateLabel,
    pointBalance,
    point,
    maxPoint,
    changePoint,
    useAllPoint,
    method,
    setMethod,
    isPriceOpen,
    togglePriceOpen: () => setIsPriceOpen((v) => !v),
    wantsReceipt,
    toggleReceipt: () => setWantsReceipt((v) => !v),
    price,
    finalPrice,
    goBack,
    handlePay
  }
}

function toPositiveInt(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
