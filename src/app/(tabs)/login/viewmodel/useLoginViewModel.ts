'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { consumeLoginReturnTo } from '@/shared/lib/loginReturnTo'
import { loadKakaoSDK, loginWithKakao } from '@/shared/lib/oauth'
import { loginWithNaver } from '@/shared/lib/oauth'

import { useAuthStore } from '@/shared/stores/authStore'

import { getProfile, login } from '../model'

export function useLoginViewModel() {
  const router = useRouter()
  const { setTokens, setProfile } = useAuthStore()

  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요')
      return
    }
    setError('')
    setIsLoading(true)

    try {
      // 스펙상 deviceType은 android | iphone 만 허용 → web 환경에선 user-agent로 분기
      const deviceType: 'android' | 'iphone' =
        typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent) ? 'android' : 'iphone'

      const res = await login({
        email,
        password: password,
        deviceType,
        deviceToken: 'web',
        version: '1.0.0'
      })
      setTokens(res.accessToken, res.refreshToken, res.userVerificationId)

      try {
        const profile = await getProfile(res.accessToken)
        setProfile(profile)
      } catch {
        /* profile fetch 실패해도 로그인은 성공 */
      }

      router.push(consumeLoginReturnTo())
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKakaoLogin = async () => {
    try {
      await loadKakaoSDK()
      loginWithKakao()
    } catch {
      setError('카카오 로그인을 시작할 수 없습니다')
    }
  }

  const handleNaverLogin = () => {
    try {
      loginWithNaver()
    } catch {
      setError('네이버 로그인을 시작할 수 없습니다')
    }
  }

  const openEmailForm = () => setShowEmailForm(true)

  const closeEmailForm = () => {
    setShowEmailForm(false)
    setError('')
  }

  return {
    showEmailForm,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleEmailLogin,
    handleKakaoLogin,
    handleNaverLogin,
    openEmailForm,
    closeEmailForm
  }
}
