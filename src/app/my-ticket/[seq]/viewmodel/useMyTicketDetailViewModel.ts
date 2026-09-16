'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { readGuestSeq } from '@/shared/lib/guestSession'

import { useAuthStore } from '@/shared/stores/authStore'

import { fetchMyTicketDetail, requestGuestAuth } from '../model'
import type { MyTicketDetail } from '@/shared/types/ticket'

import { getStatusMeta } from '@/app/(tabs)/tickets/viewmodel'

export const MY_TICKET_TITLE = '내 주차권'

/**
 * 내주차권 상세 (modu-web-app /my-ticket/[id] 기준).
 * - 회원: authStore 토큰으로 즉시 조회.
 * - 비회원: 휴대폰 뒷 4자리 입력 → 게스트 토큰 발급(guestSeq) → 뒷 4자리를 guestCode 로 조회.
 *   guestSeq 는 결제 복귀(/purchase/result)가 이 브라우저에 남긴 값이다.
 */
export function useMyTicketDetailViewModel(seq: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams?.get('type') ?? 'p'

  const [detail, setDetail] = useState<MyTicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needAuth, setNeedAuth] = useState(false)
  const [bulletValue, setBulletValue] = useState('')
  const [authError, setAuthError] = useState('')
  /** 비회원인데 guestSeq 도 없으면 이 브라우저에선 조회를 시작할 수 없다 */
  const [noGuestSession, setNoGuestSession] = useState(false)
  const verifyingRef = useRef(false)

  // 진입 판정 — persist 복원 이후를 봐야 하므로 마운트 후 1회
  useEffect(() => {
    const { accessToken } = useAuthStore.getState()

    if (accessToken) {
      fetchMyTicketDetail(type, seq, accessToken)
        .then(setDetail)
        .catch(() => setDetail(null))
        .finally(() => setIsLoading(false))
      return
    }

    // 비회원 — 휴대폰 뒷 4자리 인증부터
    setIsLoading(false)
    setNeedAuth(true)
    if (readGuestSeq() === null) setNoGuestSession(true)
  }, [seq, type])

  /** 뒷 4자리 입력 — 4자리가 차면 게스트 토큰 발급 후 조회 시도 */
  const onChangeBullet = useCallback(
    async (raw: string) => {
      const value = raw.replace(/\D/g, '').slice(0, 4)
      setAuthError('')
      setBulletValue(value)

      if (value.length < 4 || verifyingRef.current) return

      const guestSeq = readGuestSeq()
      if (guestSeq === null) {
        setNoGuestSession(true)
        return
      }

      verifyingRef.current = true
      try {
        const { accessToken } = await requestGuestAuth(guestSeq)
        const data = await fetchMyTicketDetail(type, seq, accessToken, value)
        setDetail(data)
        setNeedAuth(false)
      } catch {
        setAuthError('휴대폰 번호가 일치하지 않습니다. 다시 입력해 주세요.')
        setBulletValue('')
      } finally {
        verifyingRef.current = false
      }
    },
    [type, seq]
  )

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back()
    else router.push('/tickets')
  }, [router])

  const openNavigation = useCallback(() => {
    if (!detail) return
    const { latitude, longitude, name } = detail.parkinglot
    window.location.href = `nmap://route/car?dlat=${latitude}&dlng=${longitude}&dname=${encodeURIComponent(name)}&appname=kr.modu.app`
  }, [detail])

  const statusMeta = detail ? getStatusMeta(detail.ticket.status) : null

  return {
    type,
    detail,
    statusMeta,
    isLoading,
    needAuth,
    noGuestSession,
    bulletValue,
    authError,
    onChangeBullet,
    goBack,
    openNavigation
  }
}
