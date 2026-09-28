import axios from 'axios'

import apiClient from '@/shared/lib/apiClient'

import { useAuthStore } from '@/shared/stores/authStore'

import type { LoginResponse } from '@/shared/types/auth'

/**
 * 액세스 토큰 갱신 — `POST /user/token/refresh { refreshToken }` (modu-android `AuthApi.refreshToken` 과 같은 계약).
 *
 * 이 웹에는 아직 전역 401 재시도가 없다. 그래서 **토큰이 오리진을 넘어가는 지점**(pay 결제웹뷰 진입)에서만
 * 먼저 쓴다 — pay 의 웹 회원 경로에는 갱신 수단이 없어, 만료 토큰이 넘어가면 쿠폰·차량·충전금이
 * 조용히 비고(401 폴백) 차량등록 같은 쓰기 호출만 에러로 드러난다.
 *
 * @returns 갱신된 accessToken · 세션이 끝났으면 null(로그아웃까지 처리) · 일시 장애면 기존 토큰
 */
export async function refreshAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState()
  if (!refreshToken) return accessToken

  try {
    const { data } = await apiClient.post<{ data: LoginResponse }>('/user/token/refresh', { refreshToken })
    setTokens(data.data.accessToken, data.data.refreshToken, data.data.userVerificationId)
    return data.data.accessToken
  } catch (error) {
    // 네트워크·서버 장애는 세션 만료가 아니다 — 멀쩡한 로그인을 끊지 않고 기존 토큰으로 진행한다
    if (!isRejectedSession(error)) {
      console.error('토큰 갱신 실패(일시 장애로 판단):', error)
      return accessToken
    }
    logout()
    return null
  }
}

/** 4xx 만 세션 종료로 본다 — refresh 토큰 자체가 만료·폐기된 경우다 */
function isRejectedSession(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  return status != null && status >= 400 && status < 500
}
