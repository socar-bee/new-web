import type { CheckoutTicket } from '@/shared/platform/types'
import { useAuthStore } from '@/shared/stores/authStore'

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
 * flowType 별 조회 키 — pay `entryParams.type.ts` 계약과 1:1.
 * 금액·상품명은 넘기지 않는다. 화면 값의 원본은 pay 가 하는 상세 조회다.
 */
function checkoutEntryKeys(ticket: CheckoutTicket): Record<string, string> {
  switch (ticket.flowType) {
    case 'period':
      return { couponSeq: String(ticket.couponSeq), startDate: ticket.startDate, endDate: ticket.endDate }
    case 'share':
      return { shareSeq: String(ticket.shareSeq) }
    case 'shareExtend':
      return { parkingSeq: String(ticket.parkingSeq) }
    default:
      return { couponSeq: String(ticket.couponSeq), parkingDate: ticket.parkingDate }
  }
}

/**
 * 웹 결제 — 로그인 여부로 pay 진입 경로가 갈린다. 둘 다 **같은 탭 이동**이고,
 * 결제 결과는 pay 가 이 웹의 `/purchase/result` 로 돌려보낸다.
 *
 * - 로그인: 회원 플로우 `{PAY_HOST}/?flowType=partner&couponSeq&parkingDate&returnUrl#at=<token>`
 *   진입값은 앱 Pref(PaymentEntry)와 같은 키를 query 로, 토큰은 hash 핸드오프로 싣는다
 *   (pay webEntry.ts / webHandoffAuth.ts 가 소비). 구매가 계정에 귀속돼 내 주차권에 잡힌다.
 * - 미로그인: 비회원 `{PAY_HOST}/guest?couponSeq&parkingDate&guestSeq` (pay guestEntry.ts).
 *   토큰은 넘기지 않는다 — 전화인증·게스트 토큰 발급은 pay 가 안에서 끝낸다.
 */
export function webCheckout(ticket: CheckoutTicket) {
  const host = payHost()
  if (!host) {
    console.error('NEXT_PUBLIC_PAY_HOST 미설정 — 결제 진입을 진행할 수 없습니다')
    return
  }

  const entryKeys = checkoutEntryKeys(ticket)

  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    const query = new URLSearchParams({
      flowType: ticket.flowType ?? 'partner',
      ...entryKeys,
      returnUrl: `${window.location.origin}/purchase/result`
    })
    window.location.assign(`${host}/?${query.toString()}#at=${encodeURIComponent(accessToken)}`)
    return
  }

  const query = new URLSearchParams({
    flowType: ticket.flowType ?? 'partner',
    ...entryKeys,
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
