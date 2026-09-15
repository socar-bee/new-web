'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import { usePlatform } from '@/shared/platform'

export const PURCHASE_RESULT_TITLE = '결제 완료'

/**
 * 웹 결제 완료 — pay 비회원 결제가 성공하면 이 라우트로 돌려보낸다 (docs/07-app-webview.md 미정 사항).
 *
 * 1차 구성: 반환 쿼리 계약(couponSeq 등)은 pay 와 확정 전이라 있는 값만 읽는다.
 * 앱 결제 결과는 네이티브가 그린다 — 이 화면은 웹 복귀 전용이고,
 * `payment/PaymentResult` Pref 는 절대 읽지 않는다 (네이티브가 읽고 지우는 값).
 */
export function usePurchaseResultViewModel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = usePlatform()

  // pay 반환 쿼리 — 계약 확정 전, 있으면 활용한다
  const couponSeq = searchParams?.get('couponSeq')
  const parkingDate = searchParams?.get('parkingDate')

  const goHome = useCallback(() => {
    platform.back('/')
  }, [platform])

  platform.useTopBar({ title: PURCHASE_RESULT_TITLE, onBack: goHome })

  const goTicketDetail = useCallback(() => {
    if (!couponSeq) return
    const query = parkingDate ? `?parkingDate=${parkingDate}` : ''
    router.push(`/t/${couponSeq}${query}`)
  }, [router, couponSeq, parkingDate])

  return {
    couponSeq,
    goHome,
    goTicketDetail
  }
}
