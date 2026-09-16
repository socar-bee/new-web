'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { saveLoginReturnTo } from '@/shared/lib/loginReturnTo'

import { useAuthStore } from '@/shared/stores/authStore'

import { usePlatform } from '@/shared/platform'
import { internalUrlDeeplink, openAppScheme } from '@/shared/platform/bridge/appScheme'

/** 친구초대(리퍼럴) 랜딩 — /user/config referral.referralUrl 과 동일 경로. TODO(운영): page.modu.kr */
const REFERRAL_URL = 'https://page-dev.modudev.cloud/referral/event'

/** 드로우(응모) 회차 — benefit `/draw/:dcSeq` 경로 변수. TODO(운영): 회차 확정 시 갱신 */
const BENEFIT_DRAW_DCSEQ = 1

/** benefit 원점은 환경변수로만 받는다 — pay 와 같은 정책 (web.ts payHost 참조) */
function benefitHost(): string | null {
  return process.env.NEXT_PUBLIC_BENEFIT_HOST ?? null
}

/**
 * 드로우 진입 URL.
 * 웹 진입은 benefit 이 브릿지 토큰을 못 받으므로 accessToken 을 **hash 로** 실어 넘긴다
 * (query 는 서버 로그·리퍼러에 남는다). benefit 쪽 webHandoffAuth 가 소비 후 주소에서 지운다.
 */
function buildDrawUrl(accessToken?: string | null): string | null {
  const host = benefitHost()
  if (!host) {
    console.error('NEXT_PUBLIC_BENEFIT_HOST 미설정 — 응모 진입을 진행할 수 없습니다')
    return null
  }
  const base = `${host}/draw/${BENEFIT_DRAW_DCSEQ}`
  return accessToken ? `${base}#at=${encodeURIComponent(accessToken)}` : base
}

/** 놓치지 마세요 — Figma 4537-20722 카피 */
export const BENEFIT_MISSIONS = [
  { id: 'referral', icon: '/images/icn_benefit_mail.webp', title: '친구초대하고', highlight: '3000P 받기' },
  { id: 'report', icon: '/images/icn_benefit_megaphone.webp', title: '주차장 제보하고', highlight: '최대 5000P 받기' },
  {
    id: 'insurance',
    icon: '/images/icn_benefit_car.webp',
    title: '내차 보험료 확인하고',
    highlight: '7000원 쿠폰 받기'
  },
  { id: 'volvo', icon: '/images/icn_benefit_car.webp', title: '볼보 시승 이벤트', highlight: '6일 대여요금 무료' }
] as const

/** 응모 이벤트 (Figma 4537-20722 카피) */
export const BENEFIT_RAFFLE = {
  title: '테슬라 FSD 체험권에\n응모하세요',
  subtitle: '테슬라 FSD 1개월 이용권',
  image: '/images/img_benefit_tesla.webp',
  schedule: ['응모 2026.9.14(월)~9.30(수)', '당첨 발표 10.14(수) · 1명 추첨'],
  cta: '응모하기'
} as const

export function useBenefitViewModel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = usePlatform()
  const [toastMsg, setToastMsg] = useState<{ id: number; message: string } | null>(null)

  const showComingSoon = useCallback(() => {
    setToastMsg({ id: Date.now(), message: '준비중인 서비스입니다' })
  }, [])

  /**
   * 응모하기 — benefit 드로우 웹뷰(모노레포)로 진입한다.
   * - 앱 웹뷰: 내부 웹뷰 딥링크로 새 웹뷰를 쌓는다 (인증은 benefit 이 브릿지로 직접).
   * - 웹 로그인: accessToken 을 hash 핸드오프로 넘기며 같은 탭 이동.
   * - 웹 미로그인: 로그인으로 보내고, 성공 복귀(raffle=continue) 시 이어서 진입.
   */
  const onClickRaffle = useCallback(() => {
    if (platform.kind === 'app') {
      const url = buildDrawUrl()
      if (url) openAppScheme(internalUrlDeeplink(url))
      return
    }

    const { accessToken } = useAuthStore.getState()
    if (!accessToken) {
      saveLoginReturnTo('/benefit?raffle=continue')
      router.push('/login')
      return
    }

    const url = buildDrawUrl(accessToken)
    if (url) window.location.assign(url)
  }, [platform.kind, router])

  // 로그인 복귀(raffle=continue) — 주소를 정리하고 응모 진입을 이어간다. 1회만.
  const continuedRef = useRef(false)
  const shouldContinueRaffle = searchParams?.get('raffle') === 'continue'
  useEffect(() => {
    if (!shouldContinueRaffle || continuedRef.current) return
    continuedRef.current = true
    window.history.replaceState(null, '', '/benefit')
    if (useAuthStore.getState().accessToken) onClickRaffle()
  }, [shouldContinueRaffle, onClickRaffle])

  /** 미션 랜딩 — 연결 확정된 것만 이동, 나머지는 준비중 안내 */
  const onClickMission = useCallback(
    (missionId: (typeof BENEFIT_MISSIONS)[number]['id']) => {
      if (missionId === 'referral') {
        window.location.assign(REFERRAL_URL)
        return
      }
      showComingSoon()
    },
    [showComingSoon]
  )

  return {
    missions: BENEFIT_MISSIONS,
    raffle: BENEFIT_RAFFLE,
    toastMsg,
    dismissToast: () => setToastMsg(null),
    onClickMission,
    onClickRaffle
  }
}
