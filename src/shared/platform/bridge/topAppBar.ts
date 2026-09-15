import type { ModuWebBridgeClient } from '@socar-inc/modu-web-bridge'

import { bridgeCloseAction } from '@/shared/platform/bridge/closeWebview'

/**
 * 좌측 뒤로가기 아이콘(24pt @3x = 72px PNG). 앱 기본 아이콘 위임은 간헐 렌더라 웹이 넘긴다.
 * 상단바는 네이티브가 URL 로 그려서 웹 컴포넌트를 꽂을 수 없다.
 */
const BACK_ICON_PATH = '/icons/topappbar-back.png'

/**
 * 네이티브 상단바를 이 화면 것으로 구성한다 — 뒤로가기 + 제목.
 *
 * `navigationIcon` 에 탭 동작을 반드시 넘긴다. 앱이 띄운 첫 화면은 `canGoBack` 이 false 라
 * action 없이 보내면 아이콘이 아예 사라진다. Android 는 `actionUrl` 을 무시하므로
 * `jsFunction` 으로 태운다 (`bridgeCloseAction` 이 분기).
 *
 * 상단바 구성은 `retentionSite` 밖 도메인으로 나가면 파기된다 — 호출부가
 * `pageshow`(persisted)·`onResume` 마다 다시 건다.
 */
export function applyNativeTopAppBar(bridge: ModuWebBridgeClient, title: string) {
  bridge
    .topAppBar({
      generalTopAppBar: { title: { value: title } },
      navigationIcon: { iconUrl: `${window.location.origin}${BACK_ICON_PATH}`, action: bridgeCloseAction() },
      trailingIcons: [],
      // null 이면 스크롤과 무관하게 제목을 항상 표시한다
      titleFadeHeight: null,
      // 현재 웹뷰 호스트만 유지한다 — 환경별 하드코딩 불필요
      retentionSite: [window.location.hostname]
    })
    .catch((error: unknown) => console.warn('TopAppBar 구성 실패:', error))
}
