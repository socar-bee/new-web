import { refreshAccessToken } from '@/shared/lib/authToken'
import { readGuestSeq } from '@/shared/lib/guestSession'
import { saveLoginReturnTo } from '@/shared/lib/loginReturnTo'

import type { CheckoutTicket } from '@/shared/platform/types'
import { useAuthStore } from '@/shared/stores/authStore'

import { buildPayUrl, payHost } from '@/shared/platform/pay'

export { payHost } from '@/shared/platform/pay'

/**
 * 웹 결제 — 로그인 여부로 pay 서비스가 갈린다 (회원 `/member` · 비회원 `/guest`).
 * 둘 다 **같은 탭 이동**이고, 결제 결과는 pay 가 이 웹의 `/purchase/result` 로 돌려보낸다.
 *
 * URL 계약은 `platform/pay.ts` 한 곳이 소유한다 — 여기서는 "누구로 보낼지"만 정한다.
 */
export async function webCheckout(ticket: CheckoutTicket) {
  const host = payHost()
  if (!host) {
    console.error('NEXT_PUBLIC_PAY_HOST 미설정 — 결제 진입을 진행할 수 없습니다')
    return
  }

  /**
   * 회원이면 **진입 직전에 토큰을 갱신한다** — pay 의 웹 회원 경로에는 갱신 수단이 없어
   * (`attachHandoffAuth`) 만료 토큰을 넘기면 화면은 떠도 회원 데이터가 전부 비어 버린다.
   */
  let accessToken: string | null = null
  if (useAuthStore.getState().isLoggedIn) {
    accessToken = await refreshAccessToken()

    // refresh 토큰까지 만료 — 결제는 로그인 뒤에 이어간다 (돌아올 곳은 지금 화면)
    if (!accessToken) {
      saveLoginReturnTo(`${window.location.pathname}${window.location.search}`)
      window.location.assign('/login')
      return
    }
  }

  window.location.assign(
    buildPayUrl(host, ticket, {
      accessToken,
      // 이전 비회원 결제 복귀가 남긴 채널 코드를 그대로 이어붙인다 (모웹 useStorageStore 와 같은 동작)
      guestSeq: readGuestSeq(),
      returnUrl: `${window.location.origin}/purchase/result`
    })
  )
}

/** 웹의 "돌아왔을 때" — bfcache 복원(`pageshow` persisted)만 신호로 본다 */
export function webOnReturn(listener: () => void) {
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) listener()
  }
  window.addEventListener('pageshow', handlePageShow)
  return () => window.removeEventListener('pageshow', handlePageShow)
}
