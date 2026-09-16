/**
 * 비회원(guest) 구매 세션 — pay guest-pay 결제 복귀(/purchase/result)가 남긴 guestSeq 를 보관한다.
 * 비회원 내주차권 조회는 `POST /user/login/guest { guestSeq }` 로 게스트 토큰을 받아 시작하므로,
 * 이 값이 없으면 이 브라우저에서 비회원 조회를 시작할 수 없다 (modu-web-app useStorageStore 대응).
 */
const KEY = 'modu:guest-seq'

export function saveGuestSeq(guestSeq: string | number) {
  const n = Number(guestSeq)
  if (!Number.isFinite(n) || n <= 0) return
  try {
    localStorage.setItem(KEY, String(n))
  } catch {}
}

export function readGuestSeq(): number | null {
  try {
    const raw = localStorage.getItem(KEY)
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}
