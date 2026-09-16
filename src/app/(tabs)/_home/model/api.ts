import apiClient from '@/shared/lib/apiClient'

import type {
  AdInventory,
  HeroBanner,
  MainNotice,
  PopularKeyword,
  PopularParking,
  QuickMenuItem,
  RecommendedRegion,
  ServerBanner,
  TopParking
} from './types'

// NOTE: v1은 큐레이션 + 모킹 데이터. 향후 API endpoint 생성 시 이 파일만 교체.

const HERO_BANNERS: HeroBanner[] = [
  {
    id: 'launch',
    title: '제휴 주차장\n사전예약 OPEN',
    subtitle: '원하는 시간에 미리 예약하세요',
    background: 'linear-gradient(135deg, #0099ff 0%, #007acc 100%)',
    image: '/images/banner_launch.webp'
  },
  {
    id: 'discount',
    title: '오늘만! 주차권 30% 할인',
    subtitle: '강남 / 잠실 / 이태원 / 성수 핫플 주차장',
    background: 'linear-gradient(135deg, #e6f5ff 0%, #cceaff 100%)',
    image: '/images/banner_discount.webp'
  }
]

const QUICK_MENU: QuickMenuItem[] = [
  // Row 1 — 핵심 플로우
  { id: 'buy', label: '바로구매', href: '/map?buyable=1', icon: '/images/icn_buy.webp' },
  { id: 'reserve', label: '사전예약', href: '/map?timefilter=1', icon: '/images/icn_reserve.webp', badge: 'HOT' },
  { id: 'airport', label: '공항주차', action: 'coming_soon', icon: '/images/icn_airport.webp' },
  { id: 'monthly', label: '월정기', action: 'coming_soon', icon: '/images/icn_monthly.webp' },
  { id: 'shared', label: '공유주차', action: 'coming_soon', icon: '/images/icn_shared.webp' },
  // Row 2 — 부가 서비스
  { id: 'carwash', label: '세차하기', action: 'coming_soon', icon: '/images/icn_carwash.webp' },
  { id: 'favorite', label: '즐겨찾기', href: '/favorites', icon: '/images/icn_favorite.webp' },
  { id: 'review', label: '후기남기기', action: 'review', icon: '/images/icn_review.webp' },
  {
    id: 'partner',
    label: '제휴신청',
    href: 'https://biz.modu.kr/valueup/form/brief?code=modunext',
    icon: '/images/icn_partner.webp'
  },
  { id: 'together', label: '모여요', href: 'https://here.modu.kr', icon: '/images/icn_here.webp', badge: 'N' }
]

const RECOMMENDED_REGIONS: RecommendedRegion[] = [
  {
    id: 'gangnam',
    name: '강남·역삼',
    lat: 37.4979,
    lng: 127.0276,
    gradient: 'linear-gradient(135deg, #ff8400 0%, #ff4c4c 100%)',
    emoji: '🏙️',
    image: '/images/region_gangnam.webp',
    badge: '인기'
  },
  {
    id: 'gwanghwamun',
    name: '광화문·종로',
    lat: 37.5759,
    lng: 126.9769,
    gradient: 'linear-gradient(135deg, #af47ff 0%, #008ae6 100%)',
    emoji: '🏛️',
    image: '/images/region_gwanghwamun.webp'
  },
  {
    id: 'jamsil',
    name: '잠실·송파',
    lat: 37.5133,
    lng: 127.1,
    gradient: 'linear-gradient(135deg, #ffb14d 0%, #ff8400 100%)',
    emoji: '🎢',
    image: '/images/region_jamsil.webp',
    badge: '인기'
  },
  {
    id: 'myeongdong',
    name: '명동·을지로',
    lat: 37.5634,
    lng: 126.9836,
    gradient: 'linear-gradient(135deg, #ff7575 0%, #cc3d3d 100%)',
    emoji: '🛍️',
    image: '/images/region_myeongdong.webp'
  },
  {
    id: 'itaewon',
    name: '이태원·한남',
    lat: 37.5341,
    lng: 126.9947,
    gradient: 'linear-gradient(135deg, #00ccc8 0%, #009996 100%)',
    emoji: '🌃',
    image: '/images/region_itaewon.webp',
    badge: '핫플'
  },
  {
    id: 'yeouido',
    name: '여의도',
    lat: 37.5219,
    lng: 126.9245,
    gradient: 'linear-gradient(135deg, #33adff 0%, #007acc 100%)',
    emoji: '🏢',
    image: '/images/region_yeouido.webp'
  },
  {
    id: 'seongsu',
    name: '성수',
    lat: 37.5447,
    lng: 127.0557,
    gradient: 'linear-gradient(135deg, #c275ff 0%, #56148a 100%)',
    emoji: '☕',
    image: '/images/region_seongsu.webp',
    badge: '핫플'
  },
  {
    id: 'apgujeong',
    name: '압구정·청담',
    lat: 37.5274,
    lng: 127.0286,
    gradient: 'linear-gradient(135deg, #ff7575 0%, #b33535 100%)',
    emoji: '💎',
    image: '/images/region_apgujeong.webp',
    badge: '인기'
  }
]

const POPULAR_PARKINGS: PopularParking[] = [
  {
    seq: 60001,
    name: '청량리역 주차장',
    shortLabel: '청량리역',
    gradient: 'linear-gradient(135deg, #ff8400 0%, #ff4c4c 100%)',
    emoji: '🚉',
    keyword: '청량리역'
  },
  {
    seq: 60002,
    name: '서울숲 주차장',
    shortLabel: '서울숲',
    gradient: 'linear-gradient(135deg, #00ccc8 0%, #009996 100%)',
    emoji: '🌳',
    keyword: '서울숲'
  },
  {
    seq: 60003,
    name: '그랑서울 주차장',
    shortLabel: '그랑서울',
    gradient: 'linear-gradient(135deg, #33adff 0%, #006bb3 100%)',
    emoji: '🏢',
    keyword: '그랑서울'
  },
  {
    seq: 60004,
    name: '수원역 주차장',
    shortLabel: '수원역',
    gradient: 'linear-gradient(135deg, #ffb14d 0%, #d97000 100%)',
    emoji: '🚆',
    keyword: '수원역'
  },
  {
    seq: 60005,
    name: '광명역 주차장',
    shortLabel: '광명역',
    gradient: 'linear-gradient(135deg, #af47ff 0%, #3f0e65 100%)',
    emoji: '🚄',
    keyword: '광명역'
  },
  {
    seq: 60006,
    name: '을지트윈타워',
    shortLabel: '을지로',
    gradient: 'linear-gradient(135deg, #00e6e1 0%, #009996 100%)',
    emoji: '🏙️',
    keyword: '을지트윈타워'
  },
  {
    seq: 60007,
    name: '개화역 환승주차장',
    shortLabel: '개화역',
    gradient: 'linear-gradient(135deg, #ff7575 0%, #992e2e 100%)',
    emoji: '🚌',
    keyword: '개화역'
  }
]

/** 비율 cap — modu-android BannerData.kt: 0.25~8 범위, 무효 시 4:1 */
function clampBannerRatio(width: number, height: number): number {
  const ratio = width > 0 && height > 0 ? width / height : NaN
  if (!Number.isFinite(ratio)) return 4
  return Math.min(8, Math.max(0.25, ratio))
}

/** 서버 배너 → 캐러셀 슬라이드. 웹이 처리 못 하는 랜딩(외부앱·알림설정)은 이미지만 표출 */
function toHeroBanner(banner: ServerBanner): HeroBanner {
  let href: string | undefined
  if (banner.type === 1) href = 'https://app.modu.kr/notice'
  else if (banner.type === 2 && banner.parkinglotSeq) href = `/p/${banner.parkinglotSeq}`
  else if (banner.type === 3 && banner.url) href = banner.url

  return {
    id: `server-${banner.bannerSeq}`,
    title: '',
    background: 'var(--color-brand-50)',
    image: banner.filePath,
    href,
    ratio: clampBannerRatio(banner.width, banner.height)
  }
}

/**
 * 홈 배너 — 서버 배너(GET /user/config/banner, 인증·파라미터 불필요) 우선,
 * 실패·빈 응답이면 정적 배너 fallback. 정렬·노출 기간 필터는 서버 책임 (modu-android 동일).
 */
export async function fetchHeroBanners(): Promise<HeroBanner[]> {
  try {
    const { data } = await apiClient.get<{ data: { banners: ServerBanner[] } }>('/user/config/banner')
    const banners = (data.data?.banners ?? []).filter((b) => b.filePath)
    if (banners.length) return banners.map(toHeroBanner)
  } catch (error) {
    console.warn('서버 배너 조회 실패 — 정적 배너로 대체:', error)
  }
  return HERO_BANNERS
}

export async function fetchQuickMenu(): Promise<QuickMenuItem[]> {
  return QUICK_MENU
}

export async function fetchRecommendedRegions(): Promise<RecommendedRegion[]> {
  return RECOMMENDED_REGIONS
}

export async function fetchPopularParkings(): Promise<PopularParking[]> {
  return POPULAR_PARKINGS
}

const TOP_PARKINGS: TopParking[] = [
  { seq: 232253, name: '하이파킹 서울역', areaLabel: '서울역', image: '/images/parking_232253.webp' },
  { seq: 203763, name: 'L7호텔 홍대', areaLabel: '홍대', image: '/images/parking_203763.webp' },
  { seq: 204949, name: '홍대 와이즈파크', areaLabel: '홍대·합정', image: '/images/parking_204949.webp' },
  { seq: 203879, name: '커피빈 뉴압구정점', areaLabel: '압구정', image: '/images/parking_203879.webp' },
  { seq: 203629, name: '카카오T 싹아트센터', areaLabel: '강남', image: '/images/parking_203629.webp' },
  { seq: 203642, name: '보라빌딩 신논현역', areaLabel: '신논현', image: '/images/parking_203642.webp' },
  { seq: 204205, name: '아마노 신촌포스빌', areaLabel: '신촌', image: '/images/parking_204205.webp' },
  { seq: 204218, name: '서울역사박물관', areaLabel: '광화문', image: '/images/parking_204218.webp' },
  { seq: 203852, name: '하이파킹 하우스디비즈', areaLabel: '강남', image: '/images/parking_203852.webp' },
  { seq: 206607, name: '삼성전자 서비스센터', areaLabel: '삼성동', image: '/images/parking_206607.webp' }
]

export async function fetchTopParkings(): Promise<TopParking[]> {
  return TOP_PARKINGS
}

const POPULAR_KEYWORDS: PopularKeyword[] = [
  { rank: 1, keyword: '성수역 2호선', searchCount: 7049, wowDelta: 12.7 },
  { rank: 2, keyword: '코엑스', searchCount: 5943, wowDelta: 9.6 },
  { rank: 3, keyword: '고척스카이돔', searchCount: 5601, wowDelta: -13.9 },
  { rank: 4, keyword: '서울숲', searchCount: 5397, wowDelta: 196.1 },
  { rank: 5, keyword: '홍대입구역 2호선', searchCount: 4967, wowDelta: -4.6 },
  { rank: 6, keyword: '광명역 (고속철도)', searchCount: 4568, wowDelta: 25.9 },
  { rank: 7, keyword: '강남역 2호선', searchCount: 4122, wowDelta: -9.3 },
  { rank: 8, keyword: '혜화역 4호선', searchCount: 3446, wowDelta: 11.3 },
  { rank: 9, keyword: '서울역 (고속철도)', searchCount: 2767, wowDelta: 2.2 },
  { rank: 10, keyword: '광화문', searchCount: 2520, wowDelta: 53.4 }
]

export async function fetchPopularKeywords(): Promise<PopularKeyword[]> {
  return POPULAR_KEYWORDS
}

/** 웹 식별 키 — /user/config 의 key 파라미터용 (앱은 deviceId). localStorage 에 1회 생성 */
function getWebDeviceKey(): string {
  const KEY = 'modu_web_device_key'
  try {
    const existing = localStorage.getItem(KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    localStorage.setItem(KEY, created)
    return created
  } catch {
    return 'web'
  }
}

export interface HomeConfig {
  mainNotice: MainNotice | null
  adInventory: AdInventory | null
}

/**
 * 홈 설정 — GET /user/config 한 번으로 메인 공지 + 검색배너(adInventory)를 받는다
 * (modu-android ConfigApi 계약). 앱 전용 파라미터(deviceToken=FCM)는 웹에서 빈 값으로
 * 보낸다 — 서버가 거부하면 공지·배너 없이 조용히 넘어간다 (홈 진입을 막지 않는다).
 */
export async function fetchHomeConfig(): Promise<HomeConfig> {
  try {
    const { data } = await apiClient.get<{
      data: { mainNotice?: MainNotice | null; adInventory?: AdInventory | null }
    }>('/user/config', {
      params: {
        key: getWebDeviceKey(),
        deviceType: 'web',
        deviceToken: '',
        version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'
      }
    })
    const notice = data.data?.mainNotice
    const ad = data.data?.adInventory
    return {
      mainNotice: notice?.isActive && notice.url ? notice : null,
      adInventory: ad?.isActive && ad.bannerUrl ? ad : null
    }
  } catch (error) {
    console.warn('홈 설정 조회 실패 — 공지·검색배너 미노출:', error)
    return { mainNotice: null, adInventory: null }
  }
}
