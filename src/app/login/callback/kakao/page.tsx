'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

import apiClient from '@/shared/lib/apiClient'
import { consumeLoginReturnTo } from '@/shared/lib/loginReturnTo'

import { useAuthStore } from '@/shared/stores/authStore'

import type { LoginResponse, UserProfile } from '@/shared/types/auth'

function KakaoCallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { setTokens, setProfile } = useAuthStore()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = params.get('code')
    if (!code) {
      router.replace('/login')
      return
    }

    // 인가코드 → 카카오 토큰 교환 → 백엔드 소셜 로그인
    const exchange = async () => {
      try {
        // 1) 인가코드로 카카오 access_token 받기
        const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.NEXT_PUBLIC_KAKAO_APP_KEY!,
            redirect_uri: `${window.location.origin}/login/callback/kakao`,
            code
          })
        })
        const tokenData = await tokenRes.json()

        if (!tokenData.access_token) throw new Error('카카오 토큰 교환 실패')

        // 2) 백엔드 소셜 로그인
        const { data } = await apiClient.post<{ data: LoginResponse }>('/login/social', {
          provider: 'kakao',
          accessToken: tokenData.access_token,
          deviceType: 'web',
          deviceToken: 'web',
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
        })

        setTokens(data.data.accessToken, data.data.refreshToken, data.data.userVerificationId)

        // 3) 프로필 조회
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

export default function KakaoCallbackPage() {
  return (
    <Suspense>
      <KakaoCallbackInner />
    </Suspense>
  )
}
