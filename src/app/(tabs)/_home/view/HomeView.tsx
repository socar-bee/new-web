'use client'

import {
  IconBellLine,
  IconChevronDownLine,
  IconMarkerFill,
  IconSearchLine,
  IconStarFill,
  IconXLine
} from '@socar-inc/modu-ui/icons'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import EventBanner from '@/shared/components/ui/EventBanner'
import type { EventBannerSlide } from '@/shared/components/ui/EventBanner'
import Toast from '@/shared/components/ui/Toast'
import { useRecentParkings, type RecentParking } from '@/shared/hooks/useRecentParkings'

import type { HeroBanner, PopularKeyword, QuickMenuItem, RecommendedRegion, TopParking } from '../model'

import { useHomeViewModel } from '../viewmodel'

/** 세차 프로모션 링크 — TODO(운영 배포): prod 는 https://carwash.modu.kr */
const CAR_WASH_PROMOTION_LINK = 'https://carwash-dev.modudev.cloud'

/** 메인 이벤트 팝업 슬라이드 — modu-web-app carWashPromotion.popup 과 동일 구성 */
const HOME_EVENT_BANNER_SLIDES: EventBannerSlide[] = [
  {
    variant: 'promotion',
    title: '세차 가격\n전국 최저가 도전',
    subtitle: '지금 가장 저렴하게, 깨끗하게',
    actionLabel: '세차장 보러가기',
    href: CAR_WASH_PROMOTION_LINK,
    image: '/images/img_car_wash.webp',
    alt: '세차 중인 흰색 차량과 세차기'
  }
]

export default function HomeView() {
  const vm = useHomeViewModel()
  const [showReviewSheet, setShowReviewSheet] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ id: number; message: string } | null>(null)

  const showToast = useCallback((message: string) => {
    setToastMsg({ id: Date.now(), message })
  }, [])

  return (
    <div className="bg-bg-white flex min-h-full flex-col overflow-x-clip">
      <div className="bg-bg-white sticky top-0 z-20">
        <TopBar />
        <LocationChip label={vm.locationLabel} isLocating={vm.isLocating} onClick={vm.detectLocation} />
      </div>
      {/* 상단 배너 — 앱 검색배너(adInventory) 328×80 스트립 */}
      {vm.adBanner && (
        <div className="bg-bg-white px-5 pt-1 pb-2">
          <button onClick={vm.goAdBanner} className="block w-full cursor-pointer" aria-label="이벤트 배너">
            <img
              src={vm.adBanner.bannerUrl}
              alt=""
              className="w-full rounded-[10px] object-cover"
              style={{ aspectRatio: '328 / 80' }}
            />
          </button>
        </div>
      )}
      <QuickMenuGrid
        items={vm.quickMenu}
        onAction={(action) => {
          if (action === 'review') setShowReviewSheet(true)
          if (action === 'coming_soon') showToast('준비중인 서비스입니다')
        }}
      />
      <div className="bg-bg-weak h-2.5" />
      <AnimatePresence>{showReviewSheet && <ReviewSheet onClose={() => setShowReviewSheet(false)} />}</AnimatePresence>
      <Toast id={toastMsg?.id} message={toastMsg?.message ?? null} onDismiss={() => setToastMsg(null)} />
      {/* 지역 BEST — 임시 비활성화 (2026-09-16). 재활성화 시 아래 주석 해제 */}
      {/* <RegionsSection
        regions={vm.regions}
        isLoading={vm.isRegionsLoading}
        onClickRegion={vm.goToRegion}
        onNearby={vm.goNearby}
      />
      <div className="bg-bg-weak h-2.5" /> */}
      {/* 주차장 BEST — 임시 비활성화 (2026-09-16). 해당 슬롯을 '최근 본 주차장'(조회 기록)으로 대체 */}
      {/* <TopParkingsSection
        parkings={vm.topParkings}
        isLoading={vm.isTopParkingsLoading}
        onClickParking={vm.goToTopParking}
      /> */}
      <RecentParkingsSection />
      <div className="bg-bg-weak h-2.5" />
      <PopularKeywordsSection
        keywords={vm.popularKeywords}
        isLoading={vm.isPopularKeywordsLoading}
        onClickKeyword={vm.goToKeyword}
      />
      {/* 세차 띠배너 — modu-web-app SlideBanner(carWash) 이관. 풀블리드로 푸터에 직결 */}
      <CarWashStripBanner />
      <HomeFooter />
      {/* 메인 이벤트 팝업 — modu-web-app EventBanner (정적 슬라이드. 서버 mainNotice API 는 유지하되 미사용) */}
      <EventBanner slides={HOME_EVENT_BANNER_SLIDES} todayDismissKey="modu:home-event-banner" />
    </div>
  )
}

/* ─── 세차 띠배너 — modu-web-app SlideBanner carWash variant (58px 스트립) 이관.
   풀블리드(라운딩·좌우 마진 없음)로 푸터에 바로 붙는다. X 닫기는 세션 동안 유지 ─── */
function CarWashStripBanner() {
  const [isClosed, setIsClosed] = useState(false)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem('modu_carwash_strip_closed') === '1') setIsClosed(true)
    } catch {
      /* 접근 불가 시 그냥 노출 */
    }
  }, [])

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsClosed(true)
    try {
      sessionStorage.setItem('modu_carwash_strip_closed', '1')
    } catch {
      /* 저장 실패 시 이번 렌더에서만 숨김 */
    }
  }

  if (isClosed) return null

  return (
    <a
      href={CAR_WASH_PROMOTION_LINK}
      className="bg-primary relative flex h-[58px] w-full shrink-0 cursor-pointer items-center overflow-hidden px-4 pr-11"
    >
      <div className="relative z-10 flex w-[195px] flex-col items-start font-semibold text-white">
        <p className="text-b3">세차 가격 전국 최저가 도전</p>
        <p className="text-b5">지금 가장 저렴하게, 깨끗하게</p>
      </div>
      <div className="pointer-events-none absolute top-1 right-11 h-[58px] w-24 overflow-hidden">
        <Image
          src="/images/img_car_wash.webp"
          alt="세차 중인 흰색 차량과 세차기"
          width={1536}
          height={1024}
          className="absolute top-[-3.94px] left-[-0.14px] h-[65.88px] w-[99.4px] max-w-none"
          loading="eager"
          unoptimized
        />
      </div>
      <button
        type="button"
        aria-label="세차 배너 닫기"
        onClick={handleClose}
        className="absolute top-1/2 right-2 z-20 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center text-white"
      >
        <IconXLine className="size-5" />
      </button>
    </a>
  )
}

/* ─── Top Bar (sticky) ─── */
function TopBar() {
  return (
    <>
      <header className="bg-bg-white">
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
          <Link href="/" aria-label="홈" className="flex size-9 shrink-0 items-center justify-center">
            <img src="/images/icn_modu.svg" alt="모두의주차장" width={28} height={28} />
          </Link>
          <Link
            href="/search"
            className="bg-bg-soft flex h-10 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-full px-4"
          >
            <IconSearchLine className="text-icon-soft size-[18px] shrink-0" />
            <span className="text-text-soft text-b4 truncate">목적지 또는 주차장을 검색하세요</span>
          </Link>
          <Link
            href="https://page.modu.kr/userguide"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="알림"
            className="text-text-sub relative flex size-9 shrink-0 items-center justify-center"
          >
            <IconBellLine className="size-[22px]" />
            <span className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full" />
          </Link>
        </div>
      </header>
    </>
  )
}

/* ─── 위치 칩 ─── */
function LocationChip({ label, isLocating, onClick }: { label: string; isLocating: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-text-strong flex items-center gap-1 px-5 pt-1 pb-3 text-left">
      <IconMarkerFill className="size-[18px] text-red-500" />
      {isLocating ? (
        <span className="text-text-soft text-t4 font-bold">위치 확인 중…</span>
      ) : (
        <span className="text-t4 font-bold">{label}</span>
      )}
      <IconChevronDownLine className="text-icon-strong size-3.5" />
    </button>
  )
}

/* ─── 퀵메뉴 4×5 그리드 ─── */
function QuickMenuGrid({ items, onAction }: { items: QuickMenuItem[]; onAction?: (action: string) => void }) {
  const iconContent = (it: QuickMenuItem) => (
    <>
      <span className="relative flex size-12 items-center justify-center">
        {it.icon ? (
          <img
            src={it.icon}
            alt={it.label}
            width={48}
            height={48}
            className="size-12 object-contain"
            draggable={false}
          />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-2xl" style={{ background: it.bgColor }}>
            <span className="text-t1 leading-none">{it.emoji}</span>
          </span>
        )}
        {it.badge && (
          <span className="text-c4 absolute -top-1 -right-0.5 flex h-[18px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 leading-none font-extrabold text-white">
            {it.badge}
          </span>
        )}
      </span>
      <span className="text-text-strong text-c3 font-medium">{it.label}</span>
    </>
  )

  if (!items.length) {
    return (
      <section className="grid grid-cols-5 gap-y-5 px-3 py-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="bg-bg-soft size-12 animate-pulse rounded-2xl" />
            <div className="bg-bg-soft h-3 w-12 animate-pulse rounded" />
          </div>
        ))}
      </section>
    )
  }

  return (
    <section className="grid grid-cols-5 gap-y-5 px-3 py-6">
      {items.map((it) =>
        it.action ? (
          <button
            key={it.id}
            onClick={() => onAction?.(it.action!)}
            className="flex cursor-pointer flex-col items-center gap-1.5"
          >
            {iconContent(it)}
          </button>
        ) : (
          <Link
            key={it.id}
            href={it.href ?? '/'}
            {...(it.href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="flex cursor-pointer flex-col items-center gap-1.5"
          >
            {iconContent(it)}
          </Link>
        )
      )}
    </section>
  )
}

/* ─── 어디로 가시나요? (라운드 지역 카드) — 임시 비활성화 중 (렌더 위치 주석 참조) ─── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RegionsSection({
  regions,
  isLoading,
  onClickRegion,
  onNearby
}: {
  regions: RecommendedRegion[]
  isLoading: boolean
  onClickRegion: (r: RecommendedRegion) => void
  onNearby: () => void
}) {
  return (
    <section className="bg-bg-white py-6">
      <div className="flex items-center justify-between px-5">
        <h2 className="text-text-strong text-t3 font-bold">
          지역 <span className="text-primary">BEST</span>
        </h2>
        <button
          onClick={onNearby}
          className="bg-primary text-static-white text-t6 flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 font-semibold"
        >
          <IconMarkerFill className="size-3.5" />내 주변
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-4 px-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="bg-bg-soft aspect-square w-full animate-pulse rounded-2xl" />
                <div className="bg-bg-soft h-3 w-14 animate-pulse rounded" />
              </div>
            ))
          : regions.slice(0, 8).map((r, i) => <RegionCard key={r.id} region={r} index={i} onSelect={onClickRegion} />)}
      </div>
    </section>
  )
}

const RegionCard = memo(function RegionCard({
  region,
  index,
  onSelect
}: {
  region: RecommendedRegion
  index: number
  onSelect: (region: RecommendedRegion) => void
}) {
  return (
    <motion.button
      onClick={() => onSelect(region)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25, ease: 'easeOut' }}
      className="flex w-full cursor-pointer flex-col items-center gap-2 text-left"
    >
      <div
        className="relative flex aspect-square w-full items-end justify-end overflow-hidden rounded-2xl p-2"
        style={
          region.image
            ? { backgroundImage: `url(${region.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: region.gradient }
        }
      >
        {region.image && <span aria-hidden className="absolute inset-0 bg-black/20" />}
        {!region.image && <span className="text-h1 leading-none">{region.emoji}</span>}
        {region.badge && (
          <span className="text-primary text-c4 relative z-10 rounded-full bg-white/95 px-1.5 py-0.5 leading-none font-bold">
            {region.badge}
          </span>
        )}
        {!region.image && (
          <span aria-hidden className="absolute -top-4 -right-4 size-12 rounded-full bg-white/20 blur-xl" />
        )}
      </div>
      <span className="text-text-strong text-t6 font-semibold">{region.name}</span>
    </motion.button>
  )
})

/* ─── 인기 주차장 BEST (사진 가로 스크롤) ─── */
/* ─── 최근 본 주차장 (조회 기록 — localStorage, 비로그인 가용) ─── */
function RecentParkingsSection() {
  const router = useRouter()
  const { parkings } = useRecentParkings()

  return (
    <>
      <section className="bg-bg-white py-6">
        <div className="flex items-center gap-1.5 px-5">
          <Image
            src="/images/icn_recent.webp"
            alt=""
            width={20}
            height={20}
            className="size-5 shrink-0 object-contain"
          />
          <h2 className="text-text-strong text-t3 font-bold">최근 본 주차장</h2>
        </div>
        {parkings.length ? (
          <div className="scrollbar-hide mt-4 overflow-x-auto">
            <div className="flex w-max gap-3 px-5">
              {parkings.map((p, i) => (
                <RecentParkingCard key={p.seq} parking={p} index={i} onSelect={() => router.push(`/p/${p.seq}`)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-bg-weak mx-5 mt-4 flex flex-col items-center gap-3 rounded-2xl px-4 py-8">
            <p className="text-text-sub text-b4 text-center">
              최근 둘러본 주차장이 여기에 모여요.
              <br />내 주변 주차장부터 찾아볼까요?
            </p>
            <button
              onClick={() => router.push('/map')}
              className="bg-primary text-static-white text-t5 cursor-pointer rounded-full px-4 py-2 font-semibold"
            >
              내 주변 주차장 보기
            </button>
          </div>
        )}
      </section>
    </>
  )
}

const RecentParkingCard = memo(function RecentParkingCard({
  parking,
  index,
  onSelect
}: {
  parking: RecentParking
  index: number
  onSelect: () => void
}) {
  return (
    <motion.button
      onClick={onSelect}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: 'easeOut' }}
      className="flex w-[104px] shrink-0 cursor-pointer flex-col gap-1.5 text-left"
    >
      <div className="bg-bg-soft relative h-[104px] w-[104px] overflow-hidden rounded-2xl">
        {parking.image ? (
          <img
            src={parking.image}
            alt={parking.name}
            draggable={false}
            className="h-full w-full object-cover select-none"
          />
        ) : (
          <div className="text-text-soft text-h2 flex h-full w-full items-center justify-center font-bold">P</div>
        )}
      </div>
      <span className="text-text-strong text-t6 truncate font-semibold">{parking.name}</span>
    </motion.button>
  )
})

// 임시 비활성화 중 (렌더 위치 주석 참조)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TopParkingsSection({
  parkings,
  isLoading,
  onClickParking
}: {
  parkings: TopParking[]
  isLoading: boolean
  onClickParking: (p: TopParking) => void
}) {
  return (
    <section className="bg-bg-white py-6">
      <div className="px-5">
        <h2 className="text-text-strong text-t3 font-bold">
          주차장 <span className="text-primary">BEST</span>
        </h2>
      </div>
      <div className="scrollbar-hide mt-4 overflow-x-auto">
        <div className="flex w-max gap-3 px-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex w-[120px] shrink-0 flex-col gap-2">
                  <div className="bg-bg-soft h-[120px] w-[120px] animate-pulse rounded-2xl" />
                  <div className="bg-bg-soft h-3 w-20 animate-pulse rounded" />
                </div>
              ))
            : parkings.map((p, i) => (
                <motion.button
                  key={p.seq}
                  onClick={() => onClickParking(p)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.22, ease: 'easeOut' }}
                  className="flex w-[120px] shrink-0 cursor-pointer flex-col gap-1.5 text-left"
                >
                  <div className="relative h-[120px] w-[120px] overflow-hidden rounded-2xl">
                    <img
                      src={p.image}
                      alt={p.name}
                      draggable={false}
                      className="h-full w-full object-cover select-none"
                    />
                    <span className="text-c4 absolute top-2 left-2 rounded-full bg-black/55 px-1.5 py-0.5 leading-none font-bold text-white">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-text-strong text-t6 truncate font-semibold">{p.name}</span>
                  <span className="text-text-sub text-b5 -mt-0.5 leading-none">{p.areaLabel}</span>
                </motion.button>
              ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 후기 남기기 시트 ─── */
function ReviewSheet({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const LABELS = ['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요!']

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[480px] bg-black/50"
        style={{ bottom: 'var(--dock-height, 0px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed left-1/2 z-50 max-h-[85svh] min-h-[320px] w-full max-w-[480px] -translate-x-1/2 overflow-y-auto rounded-t-3xl bg-white pb-8 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
        style={{ bottom: 'var(--dock-height, 0px)' }}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="bg-stroke-sub h-1 w-10 rounded-full" />
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <span className="text-h1">🎉</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-text-strong text-t3 font-bold">후기가 등록되었어요!</span>
              <span className="text-text-soft text-b4">소중한 리뷰 감사합니다</span>
            </div>
            <button
              onClick={onClose}
              className="bg-primary text-t5 mt-2 rounded-full px-8 py-3 font-semibold text-white"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-text-strong text-t4 font-bold">후기 남기기</span>
            </div>

            <div className="flex flex-col gap-4 px-5 pb-2">
              {/* 별점 */}
              <div className="flex flex-col items-center gap-2.5 py-2">
                <span className="text-text-sub text-b4">이용하신 주차장은 어떠셨나요?</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-110"
                    >
                      <IconStarFill className={`size-10 ${rating >= star ? 'text-yellow-500' : 'text-neutral-200'}`} />
                    </button>
                  ))}
                </div>
                <span
                  className={`text-c2 font-medium transition-opacity ${rating > 0 ? 'text-primary opacity-100' : 'opacity-0'}`}
                >
                  {LABELS[rating]}
                </span>
              </div>

              {/* 텍스트 */}
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="후기를 남겨주세요 (선택)"
                  maxLength={300}
                  rows={3}
                  className="border-stroke-soft bg-bg-soft text-text-strong placeholder:text-text-disabled text-b4 w-full resize-none rounded-2xl border px-4 py-3 outline-none"
                />
                <span className="text-text-disabled text-b5 absolute right-3 bottom-3">{text.length}/300</span>
              </div>

              {/* 등록 버튼 */}
              <button
                onClick={() => rating > 0 && setSubmitted(true)}
                className={`text-t4 w-full rounded-2xl py-3.5 font-bold transition-colors ${
                  rating > 0 ? 'bg-primary text-white' : 'bg-bg-soft text-text-disabled'
                }`}
              >
                등록하기
              </button>
            </div>
          </>
        )}
      </motion.div>
    </>
  )
}

/* ─── 인기 검색어 BEST (주간 Top 10 + WoW 변동률) ─── */
function PopularKeywordsSection({
  keywords,
  isLoading,
  onClickKeyword
}: {
  keywords: PopularKeyword[]
  isLoading: boolean
  onClickKeyword: (keyword: PopularKeyword) => void
}) {
  const half = Math.ceil(keywords.length / 2)
  const col1 = keywords.slice(0, half)
  const col2 = keywords.slice(half)

  return (
    <section className="bg-bg-white py-6">
      <div className="flex items-end justify-between px-5">
        <h2 className="text-text-strong text-t3 flex items-center gap-1.5 font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/icn_fire.png"
            alt=""
            width={22}
            height={22}
            draggable={false}
            className="size-[22px] object-contain"
            aria-hidden
          />
          <span>
            인기검색어 <span className="text-primary">BEST</span>
          </span>
        </h2>
        <span className="text-text-soft text-b5">이번 주</span>
      </div>
      <div className="mt-3 px-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2.5">
                <div className="bg-bg-soft h-4 w-5 animate-pulse rounded" />
                <div className="bg-bg-soft h-4 flex-1 animate-pulse rounded" />
                <div className="bg-bg-soft h-3 w-10 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <div className="flex flex-col">
              {col1.map((k) => (
                <KeywordRankItem key={k.rank} keyword={k} onSelect={onClickKeyword} />
              ))}
            </div>
            <div className="flex flex-col">
              {col2.map((k) => (
                <KeywordRankItem key={k.rank} keyword={k} onSelect={onClickKeyword} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const KeywordRankItem = memo(function KeywordRankItem({
  keyword,
  onSelect
}: {
  keyword: PopularKeyword
  onSelect: (keyword: PopularKeyword) => void
}) {
  const isTop3 = keyword.rank <= 3
  const delta = keyword.wowDelta
  const trend: 'up' | 'down' | 'flat' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  return (
    <motion.button
      onClick={() => onSelect(keyword)}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: keyword.rank * 0.03, duration: 0.2, ease: 'easeOut' }}
      className="flex cursor-pointer items-center gap-2.5 py-2.5 text-left"
    >
      <span
        className={`text-t5 w-5 shrink-0 text-center leading-none font-extrabold tabular-nums ${
          isTop3 ? 'text-primary' : 'text-text-disabled'
        }`}
      >
        {keyword.rank}
      </span>
      <span className="text-text-strong text-c2 min-w-0 flex-1 truncate leading-none font-medium">
        {keyword.keyword}
      </span>
      <KeywordTrendBadge trend={trend} delta={delta} />
    </motion.button>
  )
})

function KeywordTrendBadge({ trend, delta }: { trend: 'up' | 'down' | 'flat'; delta: number }) {
  if (trend === 'flat') {
    return <span className="text-text-disabled text-b5 leading-none tabular-nums">—</span>
  }
  const isUp = trend === 'up'
  return (
    <span className="text-text-sub text-t6 flex shrink-0 items-center gap-0.5 leading-none font-semibold tabular-nums">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
        {isUp ? <path d="M4 1L7 6H1L4 1Z" /> : <path d="M4 7L1 2H7L4 7Z" />}
      </svg>
      {Math.abs(delta).toFixed(1)}%
    </span>
  )
}

/* ─── 홈 푸터 ─── */
function HomeFooter() {
  const LINK_BASE = 'https://app.modu.kr'

  return (
    <footer className="bg-bg-weak px-5 py-6">
      <div className="flex flex-col gap-2">
        <p className="text-text-sub text-t6 font-semibold">(주) 쏘카</p>

        <div className="flex flex-col gap-1">
          {[
            '통신판매업 신고: 제 2019-제주오라-3호',
            '사업자등록번호: 616-81-90529, 대표자: 박재욱',
            '서비스 문의 번호: 1899-8242, Fax: 02-6969-9333',
            '주소: 제주특별자치도 제주시 공항서로 141 (도두이동)'
          ].map((text) => (
            <p key={text} className="text-text-soft text-b5">
              {text}
            </p>
          ))}
        </div>

        <div className="border-stroke-soft mt-1 flex flex-wrap items-center gap-y-1.5 border-t pt-3">
          {[
            { label: '이용약관', href: `${LINK_BASE}/terms` },
            { label: '개인정보처리방침', href: `${LINK_BASE}/privacy` },
            { label: '위치정보 이용약관', href: `${LINK_BASE}/location` },
            { label: '고객센터', href: 'https://help.modu.kr' }
          ].map((item, i, arr) => (
            <span key={item.label} className="flex items-center">
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-sub text-c3 font-medium underline underline-offset-2"
              >
                {item.label}
              </Link>
              {i < arr.length - 1 && <span className="bg-stroke-sub mx-2 inline-block h-2.5 w-px" />}
            </span>
          ))}
        </div>

        <p className="text-text-soft text-b5">© 2026 SOCAR Inc. All rights reserved.</p>
      </div>
    </footer>
  )
}
