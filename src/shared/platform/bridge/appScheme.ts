/** 앱 화면 딥링크 — 새 화면이 웹뷰 위에 쌓이므로 이 페이지는 유지된다 (닫기 스킴은 `closeWebview`) */
const APP_SCHEME = 'parkingshare://'

export const APP_DEEPLINK = {
  /** 가입·로그인 수단 바텀시트 (앱팀 제공, fc 395.7.0-fc260820SignupDeeplink.0) */
  signupSheet: `${APP_SCHEME}signup-sheet`,
  /** 차량 등록 — 결제 웹뷰 위에 쌓이고, 복귀(onResume) 시 payment-config 를 재조회한다 */
  registerCar: `${APP_SCHEME}cars/register`,
  /** 결제카드 등록 */
  registerCard: `${APP_SCHEME}cards/register`,
  /** 충전금 충전 */
  chargeVoucher: `${APP_SCHEME}voucher`
} as const

/**
 * 웹페이지를 앱 내부 웹뷰로 연다 — 브릿지가 붙은 새 웹뷰 위에 쌓여 이 페이지는 그대로 남는다.
 * 같은 문서를 다른 도메인으로 보내면 상단바 구성이 파기돼(retentionSite 밖) 돌아올 길이 없다.
 */
export function internalUrlDeeplink(url: string) {
  return `${APP_SCHEME}open-url/internal?url=${encodeURIComponent(url)}`
}

/** 앱이 아닌 환경에선 처리기가 없어 아무 일도 일어나지 않는다 */
export function openAppScheme(target: string) {
  window.location.href = target
}
