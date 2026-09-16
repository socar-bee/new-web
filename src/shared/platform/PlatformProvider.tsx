'use client'

import { createModuWebBridge } from '@socar-inc/modu-web-bridge'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import apiClient from '@/shared/lib/apiClient'

import type { PlatformContextValue } from '@/shared/platform/context'
import type { ModuWebBridgeClient } from '@socar-inc/modu-web-bridge'
import type { ReactNode } from 'react'

import { attachBridgeAuth } from '@/shared/platform/bridge/attachBridgeAuth'
import { PlatformContext } from '@/shared/platform/context'
import { readPlatformKind } from '@/shared/platform/detect'

/**
 * 브릿지는 토큰 창구다 — 설치 라우트를 허용 목록으로 한정한다 (docs/07-app-webview.md).
 * 앱 판정이어도 이 밖의 라우트에서는 브릿지를 싣지 않는다.
 */
const BRIDGE_ALLOWED_PREFIXES = ['/t/', '/p/', '/s/', '/purchase']

/**
 * 환경(웹/앱 웹뷰)을 정하고, 앱이면 웹브릿지를 설치해 context 로 내려준다.
 *
 * - 판정은 인라인 스크립트가 단 `data-platform` 을 **마운트 후** 읽는다 —
 *   `useState` 초기값에서 UA 를 읽으면 hydration mismatch (docs/05-ui-patterns.md).
 * - `dispose` 가 최종 상태라 effect setup 마다 새 인스턴스를 만든다 — Strict Mode 가
 *   setup·cleanup 을 두 번 돌려도 재설치가 아니다.
 * - 설치 결과는 ref 가 아닌 **state** 로 내린다 — ref 면 설치가 끝나도 소비처가 다시 안 그려진다.
 * - 인터셉터는 환경마다 하나만 — 앱일 때만 브릿지 인터셉터를 붙이고, 웹은 기존 동작 그대로 둔다.
 */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [kind, setKind] = useState<'web' | 'app'>('web')
  const [bridge, setBridge] = useState<ModuWebBridgeClient | null>(null)

  useEffect(() => {
    // 마운트 후 1회 환경 판정 동기화 — hydration 안전 패턴의 의도적 예외 (docs/05-ui-patterns.md)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKind(readPlatformKind())
    // hydration 완료 신호 — E2E 가 인터랙션 전에 기다린다 (클릭 유실 방지)
    document.documentElement.dataset.hydrated = 'true'
  }, [])

  const bridgeAllowed = BRIDGE_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  useEffect(() => {
    if (kind !== 'app' || !bridgeAllowed) return

    const client = createModuWebBridge()
    client.install()
    const detachAuth = attachBridgeAuth(client, apiClient)
    // 설치 완료를 소비처에 알리는 동기화 — 설치가 effect 에서만 가능해 의도적 예외
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBridge(client)

    return () => {
      setBridge(null)
      detachAuth()
      client.dispose()
    }
  }, [kind, bridgeAllowed])

  const value = useMemo<PlatformContextValue>(
    () => ({
      kind,
      // UA 는 앱인데 브릿지가 없으면(설치 대기·구버전) 소비처가 isAvailable 로 가드해 웹 폴백한다
      ready: kind === 'web' || bridge != null,
      bridge
    }),
    [kind, bridge]
  )

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}
