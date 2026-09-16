/** Hero 캐러셀 슬라이드. */
export interface HeroBanner {
  id: string
  title: string
  subtitle?: string
  /** 카드 배경 CSS (gradient 등) */
  background: string
  /** 카드 내 강조 이모지/장식 */
  decorEmoji?: string
  /** 배경 이미지 URL — 있으면 background 대신 사용, 텍스트 오버레이 숨김 */
  image?: string
  /** 클릭 랜딩 — `/` 시작이면 내부 라우트, 아니면 외부 URL. 없으면 클릭 없음 */
  href?: string
  /** 이미지 가로/세로 비율 — 서버 배너만. 캐러셀은 첫 배너 비율로 통일 (modu-android) */
  ratio?: number
}

/**
 * GET /user/config/banner 응답 배너 — modu-android BannerModels.kt 계약 (2026-09-16 확인).
 * `type` 은 지면이 아니라 **클릭 랜딩 종류**: 1 공지 · 2 주차장 · 3 웹 · 4 외부앱 · 5 알림설정.
 */
export interface ServerBanner {
  bannerSeq: number
  type: number
  filePath: string
  width: number
  height: number
  noticeSeq?: number | null
  parkinglotSeq?: number | null
  lat?: number | null
  lng?: number | null
  url?: string | null
  urlScheme?: string | null
  urlAppstore?: string | null
}

/** 퀵메뉴 아이템 (캐치테이블 아이콘 그리드 톤). */
export interface QuickMenuItem {
  id: string
  label: string
  /** 라우트 또는 외부 URL — action이 있으면 무시됨 */
  href?: string
  /** href 대신 onAction 콜백으로 처리할 동작 식별자 */
  action?: string
  /** 아이콘 이모지 (icon 없을 때 사용) */
  emoji?: string
  /** 3D 아이콘 이미지 URL (있으면 emoji + bgColor 대신 사용) */
  icon?: string
  /** 아이콘 배경 색상 (icon 없을 때 사용) */
  bgColor?: string
  /** "N", "HOT" 같은 코너 뱃지 */
  badge?: 'N' | 'HOT'
}

/** 추천 지역 — 라운드 카드. */
export interface RecommendedRegion {
  id: string
  name: string
  /** 지도 이동 좌표 */
  lat: number
  lng: number
  /** 카드 배경 그라데이션 (image 없을 때 fallback) */
  gradient: string
  /** 강조 이모지 */
  emoji: string
  /** 카드 배경 이미지 URL (있으면 gradient 대신 사용) */
  image?: string
  /** "인기"/"핫플" 코너 뱃지 */
  badge?: '인기' | '핫플'
}

/** 인기 주차장 BEST — 사진 가로 스크롤 카드. */
export interface TopParking {
  seq: number
  name: string
  /** 짧은 지역 라벨 */
  areaLabel: string
  /** /public/images 경로 */
  image: string
}

/** 인기 검색 주차장 — BEST 원형 카드. */
export interface PopularParking {
  seq: number
  name: string
  /** 짧은 라벨 (예: "강남·역삼") */
  shortLabel: string
  /** 원형 카드 그라데이션 */
  gradient: string
  emoji: string
  /** /search/[keyword] 로 이동할 검색어 */
  keyword: string
}

/** 인기 검색어 — 주간 Top 랭킹 + WoW 변동률. */
export interface PopularKeyword {
  rank: number
  keyword: string
  /** 주간 탐색 주차장 수 (사이드 정보, 표출 옵션) */
  searchCount: number
  /** WoW 변동률 (% 단위, +상승 / -하락 / 0 보합) */
  wowDelta: number
}

/**
 * 메인 공지 팝업 — GET /user/config 응답의 mainNotice (modu-android MainNotice.kt 계약).
 * 제목/이미지/기간 필드가 없다 — 콘텐츠는 전부 `url` 웹페이지, 기간은 서버가 isActive 로 관리.
 */
export interface MainNotice {
  isActive: boolean
  /** "하루 보지 않기" 판정 키 — seq 가 바뀌면 무조건 재노출 */
  mainNoticeSeq: number
  /** 팝업 안에 띄울 웹 콘텐츠 URL */
  url: string
}

/**
 * 검색배너/광고 인벤토리 — GET /user/config 응답의 adInventory (modu-android AdInventory.kt 계약).
 * 앱에선 검색 화면 상단 328×80 스트립 + 메인 FAB. 웹 홈에선 섹션 구분 배너로 쓴다.
 */
export interface AdInventory {
  seq: number
  isActive: boolean
  /** 스트립 배너 이미지 (328×80 규격) */
  bannerUrl: string
  fabUrl: string
  /** 클릭 랜딩 — `parkingshare://open-url/internal?url=<웹URL>` 형태가 흔하다 */
  deepLinkUrl: string
}
