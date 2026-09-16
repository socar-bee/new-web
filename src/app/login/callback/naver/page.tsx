'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

import apiClient from '@/shared/lib/apiClient'
import { consumeLoginReturnTo } from '@/shared/lib/loginReturnTo'

import { useAuthStore } from '@/shared/stores/authStore'

import type { LoginResponse, UserProfile } from '@/shared/types/auth'

function NaverCallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { setTokens, setProfile } = useAuthStore()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = params.get('code')
    const state = params.get('state')
    const savedState = sessionStorage.getItem('naver_oauth_state')

    if (!code || !state || state !== savedState) {
      router.replace('/login')
      return
    }

    sessionStorage.removeItem('naver_oauth_state')

    const exchange = async () => {
      try {
        // 네이버는 CORS 제한으로 클라이언트에서 직접 토큰 교환이 불가능.
        // 백엔드에서 인가코드 + state로 토큰 교환을 처리하거나,
        // 프록시 API를 사용해야 합니다.
        // 여기서는 백엔드가 code를 받아 처리하는 방식으로 구현.
        const { data } = await apiClient.post<{ data: LoginResponse }>('/login/social', {
          provider: 'naver',
          accessToken: code, // 백엔드에서 code → token 교환 처리
          deviceType: 'web',
          deviceToken: 'web',
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
        })

        setTokens(data.data.accessToken, data.data.refreshToken, data.data.userVerificationId)

        try {
          const profileRes = await apiClient.get<{ data: UserProfile }>('/user/profile', {
            headers: { Authorization: `Bearer ${data.data.accessToken}` }
          })
          setProfile(profileRes.data.data)
        } catch {
          /* profile fetch 실패해도 로그인은 성공 */
        }

        router.replace(consumeLoginReturnTo())
      } catch {
        router.replace('/login')
      }
    }

    exchange()
  }, [params, router, setTokens, setProfile])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-text-sub text-b4">로그인 처리 중...</p>
    </div>
  )
}

export default function NaverCallbackPage() {
  return (
    <Suspense>
      <NaverCallbackInner />
    </Suspense>
  )
}
