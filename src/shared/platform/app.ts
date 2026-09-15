import type { CheckoutTicket } from '@/shared/platform/types'
import type { ModuWebBridgeClient } from '@socar-inc/modu-web-bridge'

import { internalUrlDeeplink, openAppScheme } from '@/shared/platform/bridge/appScheme'
import { putPaymentEntry } from '@/shared/platform/bridge/paymentEntry'
import { payHost, webCheckout, webOnReturn } from '@/shared/platform/web'

/**
 * 앱 결제 — Pref `payment/PaymentEntry` 기록 후 pay 를 **새 웹뷰**로 연다.
 * 같은 웹뷰로 이동하면 pay 가 결제 후 웹뷰를 닫을 때 이 상세 화면까지 같이 닫힌다.
 *
 * UA 는 앱인데 브릿지가 없으면 구버전 앱이다 → 웹 비회원 결제로 폴백한다.
 */
export async function appCheckout(bridge: ModuWebBridgeClient | null, ticket: CheckoutTicket) {
  if (!bridge?.isAvailable()) {
    webCheckout(ticket)
    return
  }

  const host = payHost()
  if (!host) {
    console.error('NEXT_PUBLIC_PAY_HOST 미설정 — 결제 진입을 진행할 수 없습니다')
    return
  }

  await putPaymentEntry(bridge, { flowType: 'partner', ...ticket })
  openAppScheme(internalUrlDeeplink(host))
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
