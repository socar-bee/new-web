import type { ModuWebBridgeClient } from '@socar-inc/modu-web-bridge'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

type RetriableConfig = InternalAxiosRequestConfig & {
  /** 401 갱신 재시도 1회 가드 */
  bridgeAuthRetried?: boolean
}

const findAccessToken = (entries: ReadonlyArray<{ name: string; value?: { value: string } | null }>) =>
  entries.find(({ name }) => name === 'accessToken')?.value?.value

/**
 * BE 요청 인증을 웹브릿지 토큰과 연결한다. 앱에서는 `authStore`(localStorage)를 쓰지 않는다 —
 * 토큰의 원본은 네이티브다. 401 은 갱신 후 1회만 재시도하고, refresh 만료 시 세션 정리는
 * 네이티브 책임이라 웹은 분기하지 않는다.
 *
 * 참고 구현: modu-webview-monorepo/apps/benefit/src/shared/bridge/attachBridgeAuth.ts
 *
 * @returns 인터셉터 해제 함수
 */
export function attachBridgeAuth(bridge: ModuWebBridgeClient, instance: AxiosInstance) {
  const requestId = instance.interceptors.request.use(async (config) => {
    if (!bridge.isAvailable()) return config

    try {
      const peeked = await bridge.peekTokens({ names: ['accessToken'] })
      const accessToken = findAccessToken(peeked.tokenEntries)
      // 세션이 없으면 value 가 생략된다 — 무토큰으로 보내고 401 흐름에 맡긴다
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
    } catch (error) {
      console.warn('accessToken 조회 실패 — 무토큰으로 요청 진행:', error)
    }

    return config
  })

  const responseId = instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    if (error.response?.status !== 401 || !config || config.bridgeAuthRetried || !bridge.isAvailable()) {
      throw error
    }

    // 동시 다발 401 이어도 네이티브가 갱신을 1회로 dedupe 해 결과를 공유한다 (스펙 보장)
    const refreshed = await bridge.refreshTokens()
    const accessToken = findAccessToken(refreshed.tokenEntries)
    if (!accessToken) throw error

    config.bridgeAuthRetried = true
    config.headers.Authorization = `Bearer ${accessToken}`
    return instance.request(config)
  })

  return () => {
    instance.interceptors.request.eject(requestId)
    instance.interceptors.response.eject(responseId)
  }
}
