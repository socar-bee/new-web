/**
 * PG 콜백 → 결제 화면 복귀 시 실패 사유 전달 — 토스트는 화면이 그린다.
 * sessionStorage 1회 소비 (pay `shared/lib/session` 패턴).
 */
const ERROR_KEY = 'pay:error'

export function savePaymentError(message: string) {
  try {
    sessionStorage.setItem(ERROR_KEY, message)
  } catch {
    /* 프라이빗 모드 등 접근 불가 — 토스트만 포기한다 */
  }
}

export function takePaymentError(): string | null {
  try {
    const value = sessionStorage.getItem(ERROR_KEY)
    if (value) sessionStorage.removeItem(ERROR_KEY)
    return value
  } catch {
    return null
  }
}
