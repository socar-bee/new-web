export const CLOSE_WEBVIEW_URL = 'parkingshare-internal://close'

/**
 * 네이티브가 window 전역에서 이름으로 찾아 부르는 함수 이름 — 앱과의 wire 계약이다.
 * Android 식별자 정규식이 점 표기·괄호를 막아 평면 이름을 쓰고, `window.close()` 와의 충돌을 피한다.
 */
export const CLOSE_WEBVIEW_FN = 'moduWebCloseWebview'

/** 브릿지 SDK 의 transport 감지와 같은 기준으로 iOS 웹뷰인지 본다 */
export function isIosBridge(): boolean {
  const win = window as unknown as {
    webkit?: { messageHandlers?: { moduParkingBridge?: unknown } }
  }
  return win.webkit?.messageHandlers?.moduParkingBridge != null
}

/**
 * 상단바 버튼에 물릴 "웹뷰 닫기" 동작.
 * Android 상단바 핸들러는 `actionUrl` 을 무시하므로 `jsFunction` 으로 대신 태운다.
 * SDK 가 둘 중 하나만 허용해 플랫폼별로 분기한다.
 */
export function bridgeCloseAction(ios: boolean = isIosBridge()): { actionUrl: string } | { jsFunction: string } {
  return ios ? { actionUrl: CLOSE_WEBVIEW_URL } : { jsFunction: CLOSE_WEBVIEW_FN }
}

/**
 * 웹뷰를 닫는다. 앱 웹뷰가 아닌 환경에서는 처리기가 없어 아무 일도 일어나지 않는다.
 *
 * @param deeplink 닫은 뒤 이동할 앱 화면 (생략 시 닫기만)
 */
export function closeWebview(deeplink?: string) {
  const query = deeplink ? `?deeplink=${encodeURIComponent(deeplink)}` : ''
  window.location.href = `${CLOSE_WEBVIEW_URL}${query}`
}
