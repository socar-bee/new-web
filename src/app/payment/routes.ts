export const PAYMENT_ROUTES = {
  root: '/payment',
  callback: '/payment/callback'
} as const

/** PG 결제 후 BE 가 302 로 돌려보내는 지점 — 결제 요청의 returnUrl 과 같은 상수를 쓴다 */
export const PAYMENT_CALLBACK_PATH = PAYMENT_ROUTES.callback

/** 결제 진입 URL — 조회 키만 싣는다 (금액·상품명의 원본은 상세 조회) */
export function paymentEntryUrl(couponSeq: number, parkingDate: string) {
  const query = new URLSearchParams({ couponSeq: String(couponSeq), parkingDate })
  return `${PAYMENT_ROUTES.root}?${query.toString()}`
}
