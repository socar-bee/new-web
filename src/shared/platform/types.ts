/** 결제 진입에 필요한 최소 조회 키 — 금액·상품명은 계약에 없다, 화면 값의 원본은 상세 조회다 */
export interface CheckoutTicket {
  couponSeq: number
  /** `yyyy-MM-dd`. 조회와 결제 진입값에 **같은 값**을 넘긴다 (자정 어긋남 방지) */
  parkingDate: string
}

/**
 * 환경(웹/앱 웹뷰) 차이를 흡수하는 어댑터. 라우트 viewmodel 은 이 인터페이스만 본다.
 * 렌더 결과를 바꾸지 않고 "누를 때" 동작만 바꾼다 — hydration 안전 (docs/07-app-webview.md).
 */
export interface Platform {
  kind: 'web' | 'app'
  /** 앱이면 브릿지 설치까지 끝났는지. 웹은 항상 true. UA 는 앱인데 브릿지가 없으면 구버전 앱 → 웹 폴백 */
  ready: boolean

  /** 상단바 제목·뒤로가기. 웹은 화면 안 헤더가 맡으므로 no-op */
  useTopBar(options: { title: string; onBack: () => void }): void
  /** 뒤로가기. 웹은 fallbackHref 로 이동, 앱은 웹뷰 닫기 */
  back(fallbackHref: string): void
  /** 로그인 요구. 웹은 /login, 앱은 가입·로그인 시트 */
  requestLogin(): void
  /** 결제 시작. 웹은 pay 비회원 경로, 앱은 Pref 기록 후 pay 새 웹뷰 */
  startCheckout(ticket: CheckoutTicket): Promise<void>
  /** 다른 화면·결제에서 돌아왔을 때. 해제 함수를 돌려준다 */
  onReturn(listener: () => void): () => void
}
