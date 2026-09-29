import axios from 'axios'

import apiClient from '@/shared/lib/apiClient'
import { refreshAccessToken } from '@/shared/lib/authToken'

import { useAuthStore } from '@/shared/stores/authStore'
import type { InternalAxiosRequestConfig } from 'axios'

type RetriableConfig = InternalAxiosRequestConfig & { _authRetried?: boolean }

/**
 * 진행 중인 갱신 1건을 공유한다 — 화면 진입 시 여러 조회가 함께 401 을 받는데,
 * 각자 갱신을 쏘면 refresh 토큰이 회전하는 서버에서 뒤늦은 요청이 이미 폐기된 토큰으로 나간다.
 */
let inflight: Promise<string | null> | null = null

function refreshOnce(): Promise<string | null> {
  inflight ??= refreshAccessToken().finally(() => {
    inflight = null
  })

  return inflight
}

/**
 * 만료 토큰 재시도 — 401 을 받으면 한 번 갱신하고 그 요청만 다시 보낸다.
 *
 * 이게 없으면 토큰이 만료된 회원 화면이 **조용히 빈 값으로** 떨어진다(내주차권이 "없음"처럼 보인다).
 * 갱신까지 실패하면 `refreshAccessToken` 이 로그아웃시키므로, 화면은 로그인 상태에 맞춰 다시 그려진다.
 *
 * 되살릴 대상은 **회원 토큰으로 나간 요청뿐**이다. 비회원 조회는 1회용 게스트 토큰을 직접 실어
 * 보내므로(`requestGuestAuth`), 그쪽 401 에 회원 갱신을 물리면 엉뚱한 토큰으로 재시도하게 된다.
 * 그래서 실패한 요청이 **저장소의 토큰과 같은 값**을 달고 있었을 때만 재시도한다.
 */
export function attachAuthRetry() {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error

      const config = error.config as RetriableConfig | undefined
      if (!config || config._authRetried) throw error

      const { accessToken } = useAuthStore.getState()
      if (!accessToken || config.headers?.Authorization !== `Bearer ${accessToken}`) throw error

      const refreshed = await refreshOnce()
      // 같은 값이면 갱신이 아니다 — refresh 토큰이 없거나 일시 장애로 기존 토큰이 되돌아온 경우다
      if (!refreshed || refreshed === accessToken) throw error

      config._authRetried = true
      config.headers.Authorization = `Bearer ${refreshed}`

      return await apiClient.request(config)
    }
  )
}
