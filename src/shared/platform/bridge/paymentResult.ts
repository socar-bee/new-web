import type { ModuWebBridgeClient } from '@socar-inc/modu-web-bridge'

/**
 * 결제 결과 Pref — 네이티브가 읽고 결과 화면을 띄운 뒤 지운다.
 * **성공만 기록한다** — 값이 없으면 네이티브는 결과 화면을 띄우지 않는다.
 * 원본 계약: modu-webview-monorepo/apps/pay/src/shared/bridge/paymentResult.ts (2026-09-16 확인)
 */
export const RESULT_PREF = { domainName: 'payment', itemName: 'PaymentResult' } as const

/** 결제 구분 — 제휴(couSeq) 'p' / 공유(parkingSeq) 's' (2026-07-29 네이티브 합의) */
export type PaymentResultType = 'p' | 's'

export interface PaymentResultPayload {
  type: PaymentResultType
  seq: number
}

export function toPaymentResultPayload(result: {
  couSeq?: number | null
  parkingSeq?: number | null
}): PaymentResultPayload | null {
  if (result.couSeq != null) return { type: 'p', seq: result.couSeq }
  if (result.parkingSeq != null) return { type: 's', seq: result.parkingSeq }
  return null
}

export async function savePaymentResult(bridge: ModuWebBridgeClient, payload: PaymentResultPayload): Promise<boolean> {
  if (!bridge.isAvailable()) return false
  try {
    await bridge.putPrefValue({ ...RESULT_PREF, serialized: { value: JSON.stringify(payload) } })
    return true
  } catch (error) {
    console.error('결제 결과 기록 실패:', error)
    return false
  }
}
