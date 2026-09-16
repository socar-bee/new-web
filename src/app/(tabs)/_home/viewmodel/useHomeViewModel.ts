'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { HeroBanner, MainNotice, PopularKeyword, PopularParking, RecommendedRegion, TopParking } from '../model'

import {
  useHeroBanners,
  useHomeConfig,
  usePopularKeywords,
  usePopularParkings,
  useQuickMenu,
  useRecommendedRegions,
  useTopParkings
} from '../model'

const DEFAULT_LOCATION_LABEL = '서울'

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko`,
    { headers: { 'Accept-Language': 'ko' } }
  )
  if (!res.ok) return DEFAULT_LOCATION_LABEL
  const data = await res.json()
  const { city_district, suburb, quarter, town, village } = data.address ?? {}
  const dong = suburb ?? quarter ?? town ?? village ?? ''
  const gu = city_district ?? ''
  return dong ? `현재 위치 · ${gu} ${dong}`.trim() : gu ? `현재 위치 · ${gu}` : '현재 위치'
}

export function useHomeViewModel() {
  const router = useRouter()
  const { data: banners = [] } = useHeroBanners()
  const { data: quickMenu = [] } = useQuickMenu()
  const { data: regions = [], isLoading: isRegionsLoading } = useRecommendedRegions()
  const { data: parkings = [], isLoading: isParkingsLoading } = usePopularParkings()
  const { data: topParkings = [], isLoading: isTopParkingsLoading } = useTopParkings()
  const { data: popularKeywords = [], isLoading: isPopularKeywordsLoading } = usePopularKeywords()

  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION_LABEL)
  const [isLocating, setIsLocating] = useState(false)

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const label = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        setLocationLabel(label)
        setIsLocating(false)
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    )
  }, [])

  // 이미 허용된 경우 마운트 시 자동 감지
  useEffect(() => {
    if (!navigator.permissions) return
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') detectLocation()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToRegion = useCallback(
    (region: RecommendedRegion) => {
      router.push(`/map?lat=${region.lat}&lng=${region.lng}`)
    },
    [router]
  )

  const goToParking = useCallback(
    (parking: PopularParking) => {
      router.push(`/search/${encodeURIComponent(parking.keyword)}`)
    },
    [router]
  )

  const goToTopParking = useCallback(
    (parking: TopParking) => {
      router.push(`/p/${parking.seq}`)
    },
    [router]
  )

  const goToKeyword = useCallback(
    (keyword: PopularKeyword) => {
      router.push(`/search/${encodeURIComponent(keyword.keyword)}`)
    },
    [router]
  )

  const goNearby = useCallback(() => {
    router.push('/map')
  }, [router])

  // ── 홈 설정 (메인 공지 + 검색배너) — GET /user/config 한 번
  const { data: homeConfig } = useHomeConfig()
  const mainNotice = homeConfig?.mainNotice ?? null

  /** 검색배너(adInventory) — 인기검색어 위 섹션 구분 스트립 */
  const adBanner = homeConfig?.adInventory ?? null

  /**
   * 검색배너 랜딩 — 앱 딥링크 `parkingshare://open-url/internal?url=<웹URL>` 은 안의 URL 로,
   * 일반 http(s) 는 그대로, 그 외 앱 전용 스킴은 웹에서 무시한다.
   */
  const goAdBanner = useCallback(() => {
    if (!adBanner?.deepLinkUrl) return
    const target = resolveDeepLinkToWebUrl(adBanner.deepLinkUrl)
    if (target) window.location.assign(target)
  }, [adBanner])

  /** 배너 랜딩 — 내부 라우트는 push, 외부 URL 은 같은 탭 이동 (앱 웹뷰 window.open 금지 함정) */
  const goBanner = useCallback(
    (banner: HeroBanner) => {
      if (!banner.href) return
      if (banner.href.startsWith('/')) router.push(banner.href)
      else window.location.assign(banner.href)
    },
    [router]
  )

  return {
    banners,
    goBanner,
    // 서버 mainNotice 는 API 만 유지 — 렌더는 EventBanner 정적 슬라이드가 맡는다 (2026-09-16 결정)
    mainNotice,
    adBanner,
    goAdBanner,
    quickMenu,
    regions,
    parkings,
    topParkings,
    popularKeywords,
    isRegionsLoading,
    isParkingsLoading,
    isTopParkingsLoading,
    isPopularKeywordsLoading,
    locationLabel,
    isLocating,
    detectLocation,
    goToRegion,
    goToParking,
    goToTopParking,
    goToKeyword,
    goNearby
  }
}

/** `parkingshare://open-url/internal?url=<웹URL>` → 웹 URL. http(s) 는 그대로, 그 외 null */
function resolveDeepLinkToWebUrl(deepLink: string): string | null {
  if (/^https?:\/\//i.test(deepLink)) return deepLink
  const match = deepLink.match(/^parkingshare:\/\/open-url\/internal\?url=(.+)$/i)
  if (match) {
    try {
      const decoded = decodeURIComponent(match[1])
      if (/^https?:\/\//i.test(decoded)) return decoded
    } catch {
      /* 잘못된 인코딩 — 무시 */
    }
  }
  return null
}
