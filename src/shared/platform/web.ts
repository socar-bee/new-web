import type { CheckoutTicket } from '@/shared/platform/types'

import { paymentEntryUrl } from '@/app/payment/routes'

/**
 * 웹 결제 — 이 서비스의 자체 결제 화면(`/payment`)으로 **같은 탭 이동**한다.
 * 조회 키만 싣는다 — 금액·상품명의 원본은 결제 화면의 상세 조회다.
 * (외부 pay `/guest` 비회원 경로 연동 계약은 docs/07-app-webview.md 에 보존)
 */
export function webCheckout({ couponSeq, parkingDate }: CheckoutTicket) {
  window.location.assign(paymentEntryUrl(couponSeq, parkingDate))
}

/** 웹의 "돌아왔을 때" — bfcache 복원(`pageshow` persisted)만 신호로 본다 */
export function webOnReturn(listener: () => void) {
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) listener()
  }
  window.addEventListener('pageshow', handlePageShow)
  return () => window.removeEventListener('pageshow', handlePageShow)
}
