'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import { usePlatform } from '@/shared/platform'

export const PURCHASE_RESULT_TITLE = '결제 결과'

/**
 * pay 비회원(guest-pay) 결제 복귀 화면 — pay `/guest/callback` 이 이 라우트로 돌려보낸다.
 *
 * 반환 계약 (pay milestone/guest-pay GuestCallbackPage, 2026-09-16 확인):
 * - 성공: `?result=success&type=p&parkingSeq={couSeq}&guestCode=..&guestSeq=..`
 *   (제휴 주차권인데 파라미터 이름이 parkingSeq 다 — 구매건 seq(couSeq)가 실린다)
 * - 실패/취소: `?result=fail&type=p&couponSeq=..&guestSeq=..` (pay 게스트 세션은 유지 — 재시도 가능)
 *
 * 앱 결제 결과는 네이티브가 그린다 — 이 화면은 웹 복귀 전용이고,
 * `payment/PaymentResult` Pref 는 절대 읽지 않는다 (네이티브가 읽고 지우는 값).
 */
export function usePurchaseResultViewModel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = usePlatform()

  const result = searchParams?.get('result')
  const isFail = result === 'fail'

  /** 성공 시 구매건 seq (couSeq) — type='p' 제휴 기준 */
  const purchasedSeq = searchParams?.get('parkingSeq')
  /** 실패 시 재시도 키 */
  const couponSeq = searchParams?.get('couponSeq')
  const parkingDate = searchParams?.get('parkingDate')
  /** 게스트 구매내역 조회 키 — 내 주차권(guestCode 조회) 연동 시 사용 (1차 미사용) */
  const guestCode = searchParams?.get('guestCode')
  const guestSeq = searchParams?.get('guestSeq')

  const goHome = useCallback(() => {
    platform.back('/')
  }, [platform])

  platform.useTopBar({ title: PURCHASE_RESULT_TITLE, onBack: goHome })

  /** 실패 재시도 — 주차권 상세로 (pay 게스트 세션이 유지돼 바로 다시 결제 진입 가능) */
  const goRetry = useCallback(() => {
    if (!couponSeq) {
      platform.back('/')
      return
    }
    const query = parkingDate ? `?parkingDate=${parkingDate}` : ''
    router.replace(`/t/${couponSeq}${query}`)
  }, [router, platform, couponSeq, parkingDate])

  const goTicketDetail = useCallback(() => {
    if (!couponSeq) return
    const query = parkingDate ? `?parkingDate=${parkingDate}` : ''
    router.push(`/t/${couponSeq}${query}`)
  }, [router, couponSeq, parkingDate])

  return {
    isFail,
    purchasedSeq,
    couponSeq,
    guestCode,
    guestSeq,
    goHome,
    goRetry,
    goTicketDetail
  }
}
