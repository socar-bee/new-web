export const PAYMENT_ROUTES = {
  root: '/payment'
} as const

/** 결제 진입 URL — 조회 키만 싣는다 (금액·상품명의 원본은 상세 조회) */
export function paymentEntryUrl(couponSeq: number, parkingDate: string) {
  const query = new URLSearchParams({ couponSeq: String(couponSeq), parkingDate })
  return `${PAYMENT_ROUTES.root}?${query.toString()}`
}
