import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'

import type { Platform } from '@/shared/platform/types'

import { appCheckout, appOnReturn } from '@/shared/platform/app'
import { APP_DEEPLINK, openAppScheme } from '@/shared/platform/bridge/appScheme'
import { CLOSE_WEBVIEW_FN, closeWebview } from '@/shared/platform/bridge/closeWebview'
import { applyNativeTopAppBar } from '@/shared/platform/bridge/topAppBar'
import { usePlatformContext } from '@/shared/platform/context'
import { webCheckout, webOnReturn } from '@/shared/platform/web'

/**
 * 상단바 훅 — 웹은 no-op(화면 안 헤더가 맡는다), 앱은 네이티브 상단바를 구성한다.
 *
 * 환경과 무관하게 **같은 훅 시퀀스**를 타므로 마운트 후 kind 가 web→app 으로 바뀌어도 안전하다.
 * 전역 닫기 함수는 브릿지 설치 여부와 무관하게 먼저 등록한다 — 등록이 풀린 틈에 탭이 삼켜진다.
 */
function useTopBar({ title, onBack }: { title: string; onBack: () => void }) {
  const { kind, bridge } = usePlatformContext()
  const onBackRef = useRef(onBack)

  // 최신 onBack 을 전역 닫기 함수가 참조하도록 렌더마다 동기화 (ref 쓰기는 effect 에서만)
  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(() => {
    const registry = window as unknown as Record<string, (() => void) | undefined>
    registry[CLOSE_WEBVIEW_FN] = () => onBackRef.current()
    return () => {
      delete registry[CLOSE_WEBVIEW_FN]
    }
  }, [])

  useEffect(() => {
    if (kind !== 'app' || !bridge?.isAvailable()) return

    const apply = () => applyNativeTopAppBar(bridge, title)
    apply()

    // 상단바 구성은 retentionSite 밖으로 나갔다 오면 파기된다 — 복귀 신호마다 다시 건다
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) apply()
    }
    window.addEventListener('pageshow', handlePageShow)
    const offResume = bridge.onResume(apply)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      offResume()
    }
  }, [kind, bridge, title])
}

/**
 * 환경 어댑터. 라우트 viewmodel 은 이 훅만 본다 — 렌더 결과는 환경과 무관하게 한 벌이고,
 * "누를 때" 동작만 갈린다 (docs/07-app-webview.md).
 */
export function usePlatform(): Platform {
  const { kind, ready, bridge } = usePlatformContext()
  const router = useRouter()

  return useMemo<Platform>(() => {
    if (kind === 'app') {
      return {
        kind,
        ready,
        useTopBar,
        back: () => closeWebview(),
        requestLogin: () => openAppScheme(APP_DEEPLINK.signupSheet),
        startCheckout: (ticket) => appCheckout(bridge, ticket),
        onReturn: (listener) => appOnReturn(bridge, listener)
      }
    }

    return {
      kind: 'web',
      ready: true,
      useTopBar,
      back: (fallbackHref) => router.push(fallbackHref),
      requestLogin: () => router.push('/login'),
      startCheckout: async (ticket) => webCheckout(ticket),
      onReturn: webOnReturn
    }
  }, [kind, ready, bridge, router])
}
