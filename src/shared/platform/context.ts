import { createContext, useContext } from 'react'

import type { ModuWebBridgeClient } from '@socar-inc/modu-web-bridge'

export interface PlatformContextValue {
  kind: 'web' | 'app'
  /** 앱이면 브릿지 설치까지 끝났는지. 웹은 항상 true */
  ready: boolean
  /** 앱 판정 + 허용 라우트에서만 설치된다. 설치 전(최초 렌더)에는 null — 소비처가 가드한다 */
  bridge: ModuWebBridgeClient | null
}

export const PlatformContext = createContext<PlatformContextValue>({
  kind: 'web',
  ready: true,
  bridge: null
})

export const usePlatformContext = () => useContext(PlatformContext)
