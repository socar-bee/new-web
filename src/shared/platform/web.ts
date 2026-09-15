import type { CheckoutTicket } from '@/shared/platform/types'

/** 게스트 채널 코드 — pay `/user/login/guest` body 에 실린다. 모웹 기본값 0 과 동일 (pay guestEntry.ts) */
const GUEST_CHANNEL_SEQ = 0

/**
 * pay 원점은 환경변수로만 받는다 — API 호스트 문자열로 운영 여부를 추정하지 않는다.
 * (modu-web-app `payOrigin()` 이 `api.modu.kr` 판정으로 운영 사용자를 pay-dev 로 보내는 버그가 있었다)
 */
export function payHost(): string | null {
  return process.env.NEXT_PUBLIC_PAY_HOST ?? null
}

/**
 * 웹 결제 — pay 비회원 경로로 **같은 탭 이동**한다.
 * 토큰은 넘기지 않는다 — 휴대폰 인증은 pay 가 한다.
 */
export function webCheckout({ couponSeq, parkingDate }: CheckoutTicket) {
  const host = payHost()
  if (!host) {
    console.error('NEXT_PUBLIC_PAY_HOST 미설정 — 결제 진입을 진행할 수 없습니다')
    return
  }

  const query = new URLSearchParams({
    couponSeq: String(couponSeq),
    parkingDate,
    guestSeq: String(GUEST_CHANNEL_SEQ)
  })
  window.location.assign(`${host}/guest?${query.toString()}`)
}

/** 웹의 "돌아왔을 때" — bfcache 복원(`pageshow` persisted)만 신호로 본다 */
export function webOnReturn(listener: () => void) {
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) listener()
  }
  window.addEventListener('pageshow', handlePageShow)
  return () => window.removeEventListener('pageshow', handlePageShow)
}
