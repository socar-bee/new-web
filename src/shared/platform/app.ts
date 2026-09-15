import type { CheckoutTicket } from '@/shared/platform/types'
import type { ModuWebBridgeClient } from '@socar-inc/modu-web-bridge'

import { paymentEntryUrl } from '@/app/payment/routes'
import { internalUrlDeeplink, openAppScheme } from '@/shared/platform/bridge/appScheme'
import { webCheckout, webOnReturn } from '@/shared/platform/web'

/**
 * 앱 결제 — 자체 결제 화면(`/payment`)을 **새 웹뷰**로 연다.
 * 같은 웹뷰로 이동하면 결제 화면이 닫힐 때 이 상세 화면까지 같이 닫힌다.
 * 진입값은 쿼리로 싣는다 — 외부 pay 용 Pref `payment/PaymentEntry` 계약은
 * `bridge/paymentEntry.ts` 에 보존 (외부 pay 연동으로 돌아갈 때 사용).
 *
 * UA 는 앱인데 브릿지가 없으면 구버전 앱이다 → 같은 탭 이동으로 폴백한다.
 */
export async function appCheckout(bridge: ModuWebBridgeClient | null, ticket: CheckoutTicket) {
  if (!bridge?.isAvailable()) {
    webCheckout(ticket)
    return
  }

  const paymentUrl = `${window.location.origin}${paymentEntryUrl(ticket.couponSeq, ticket.parkingDate)}`
  openAppScheme(internalUrlDeeplink(paymentUrl))
}

/**
 * 앱의 "돌아왔을 때" — `bridge.onResume` 에 더해 iOS bfcache 복원(`pageshow`)도 함께 건다.
 * iOS 는 다른 웹뷰에서 돌아오면 마운트가 다시 일어나지 않는다 (docs/07-app-webview.md 함정).
 */
export function appOnReturn(bridge: ModuWebBridgeClient | null, listener: () => void) {
  const offPageShow = webOnReturn(listener)
  const offResume = bridge?.isAvailable() ? bridge.onResume(() => listener()) : undefined

  return () => {
    offPageShow()
    offResume?.()
  }
}
