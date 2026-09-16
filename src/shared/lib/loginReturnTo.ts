/**
 * 로그인 후 복귀 경로. OAuth(카카오/네이버)는 외부 리다이렉트를 거쳐 콜백 페이지로
 * 돌아오므로 query 로는 못 나른다 — sessionStorage 에 잠깐 맡겨두고 성공 시 소비한다.
 */
const KEY = 'modu:login-return-to'

/** 같은 오리진 상대경로만 저장한다 — 외부 URL 이 섞이면 오픈 리다이렉트가 된다 */
export function saveLoginReturnTo(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) return
  try {
    sessionStorage.setItem(KEY, path)
  } catch {}
}

/** 저장된 복귀 경로를 반환하고 지운다 — 없으면 홈 */
export function consumeLoginReturnTo(): string {
  try {
    const saved = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    if (saved && saved.startsWith('/') && !saved.startsWith('//')) return saved
  } catch {}
  return '/'
}
