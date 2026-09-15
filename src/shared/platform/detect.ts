/**
 * 앱 웹뷰 판정은 User-Agent 한 가지로 한다 — 브릿지 설치 여부로 판정하지 않는다.
 * 설치·초기화 타이밍에 따라 결과가 흔들린다 (docs/07-app-webview.md).
 *
 * 같은 판정: modu-webview-monorepo/apps/carwash/src/shared/lib/webview/isModuAppWebView.ts
 */
export const isAppUserAgent = (ua: string) => /ParkingShare\/\d/i.test(ua)

/**
 * 첫 페인트 전에 돌아 `<html data-platform="app">` 을 다는 인라인 스크립트.
 * hydration 뒤에 달면 웹 전용 UI(`[data-web-only]`)가 한 번 보였다 사라진다.
 */
export const PLATFORM_DETECT_SCRIPT = `if(/ParkingShare\\/\\d/i.test(navigator.userAgent))document.documentElement.dataset.platform='app'`

/** 마운트 후에만 호출한다 — 서버에는 document 가 없다 */
export const readPlatformKind = (): 'web' | 'app' =>
  document.documentElement.dataset.platform === 'app' ? 'app' : 'web'
