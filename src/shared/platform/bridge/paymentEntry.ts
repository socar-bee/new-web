import type { ModuWebBridgeClient } from '@socar-inc/modu-web-bridge'

/**
 * 결제 웹뷰 진입 파라미터 (제휴 시간권) — 웹브릿지 Pref `payment/PaymentEntry`.
 *
 * **계약의 원본은 pay 다** — modu-webview-monorepo/apps/pay/src/shared/bridge/entryParams.type.ts
 * (2026-09-16 확인). pay 가 계약을 바꾸면 여기도 맞춘다.
 *
 * 앱은 조회 키와 사용자 입력값만 넘긴다 — 금액·주차장명·상품명은 상세 조회가 원본이다.
 */
export interface PartnerEntryParams {
  flowType: 'partner'
  couponSeq: number
  /** 날짜 포맷 `yyyy-MM-dd` (안드로이드 전달 기준, 2026-07-24 확정) */
  parkingDate: string
}

const PREF_DOMAIN = 'payment'
const PREF_ITEM = 'PaymentEntry'

/**
 * pay 진입값을 Pref 에 기록한다. 이후 pay 를 **새 웹뷰**로 연다 — 같은 웹뷰로 이동하면
 * pay 가 결제 후 웹뷰를 닫을 때 이 상세 화면까지 같이 닫힌다.
 *
 * `payment/PaymentResult` 는 읽지 않는다 — 네이티브가 읽고 지우기로 합의된 값이다.
 */
export async function putPaymentEntry(bridge: ModuWebBridgeClient, entry: PartnerEntryParams) {
  await bridge.putPrefValue({
    domainName: PREF_DOMAIN,
    itemName: PREF_ITEM,
    serialized: { value: JSON.stringify(entry) }
  })
}
