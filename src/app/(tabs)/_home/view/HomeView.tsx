'use client'

import {
  IconBellLine,
  IconChevronDownLine,
  IconMarkerFill,
  IconSearchLine,
  IconStarFill,
  IconUsageHistoryLine,
  IconXLine
} from '@socar-inc/modu-ui/icons'
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import Toast from '@/shared/components/ui/Toast'
import { useRecentSearches } from '@/shared/hooks/useRecentSearches'

import type { HeroBanner, PopularKeyword, QuickMenuItem, RecommendedRegion, TopParking } from '../model'

import { useHomeViewModel } from '../viewmodel'

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
      <HeroCarousel
        banners={vm.banners}
        index={vm.heroIndex}
        onIndexChange={vm.onHeroIndexChange}
        onDragStart={vm.onHeroDragStart}
        onDragEnd={vm.onHeroDragEnd}
      />
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
      <RegionsSection
        regions={vm.regions}
        isLoading={vm.isRegionsLoading}
        onClickRegion={vm.goToRegion}
        onNearby={vm.goNearby}
      />
      <div className="bg-bg-weak h-2.5" />
      <PopularKeywordsSection
        keywords={vm.popularKeywords}
        isLoading={vm.isPopularKeywordsLoading}
        onClickKeyword={vm.goToKeyword}
      />
      <div className="bg-bg-weak h-2.5" />
      <TopParkingsSection
        parkings={vm.topParkings}
        isLoading={vm.isTopParkingsLoading}
        onClickParking={vm.goToTopParking}
      />
      <HomeFooter />
    </div>
  )
}

/* ─── Top Bar (sticky) ─── */
function TopBar() {
  const router = useRouter()
  const [showRecent, setShowRecent] = useState(false)
  const { searches, refresh, remove, clear } = useRecentSearches()

  const openRecent = useCallback(() => {
    refresh()
    setShowRecent(true)
  }, [refresh])

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
            <span className="text-text-soft truncate text-[13px]">목적지 또는 주차장을 검색하세요</span>
          </Link>
          <button
            onClick={openRecent}
            aria-label="최근 검색"
            className="text-text-sub flex size-9 shrink-0 items-center justify-center"
          >
            <IconUsageHistoryLine className="size-[22px]" />
          </button>
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
      <AnimatePresence>
        {showRecent && (
          <RecentSearchSheet
            searches={searches}
            onClose={() => setShowRecent(false)}
            onSelect={(keyword) => {
              setShowRecent(false)
              router.push(`/search/${encodeURIComponent(keyword)}`)
            }}
            onRemove={remove}
            onClear={clear}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── 최근 검색 시트 ─── */
function RecentSearchSheet({
  searches,
  onClose,
  onSelect,
  onRemove,
  onClear
}: {
  searches: string[]
  onClose: () => void
  onSelect: (keyword: string) => void
  onRemove: (keyword: string) => void
  onClear: () => void
}) {
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
        className="fixed left-1/2 z-50 min-h-[320px] w-full max-w-[480px] -translate-x-1/2 rounded-t-3xl bg-white pb-8 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
        style={{ bottom: 'var(--dock-height, 0px)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <span className="bg-stroke-sub h-1 w-10 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-text-strong text-[16px] font-bold">최근 검색</span>
          {searches.length > 0 && (
            <button onClick={onClear} className="text-text-sub text-[13px] font-medium">
              전체삭제
            </button>
          )}
        </div>
        {searches.length === 0 ? (
          <div className="flex flex-col items-center py-14">
            <span className="text-text-soft text-[14px]">최근 검색 내역이 없어요</span>
          </div>
        ) : (
          <ul className="px-5 pb-10">
            {searches.map((keyword) => (
              <li key={keyword} className="border-stroke-soft flex items-center border-b py-3.5 last:border-0">
                <button onClick={() => onSelect(keyword)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <IconUsageHistoryLine className="text-text-disabled size-4 shrink-0" />
                  <span className="text-text-strong truncate text-[14px]">{keyword}</span>
                </button>
                <button onClick={() => onRemove(keyword)} className="text-text-disabled ml-3 shrink-0 p-1">
                  <IconXLine className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </>
  )
}

/* ─── 위치 칩 ─── */
function LocationChip({ label, isLocating, onClick }: { label: string; isLocating: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-text-strong flex items-center gap-1 px-5 pt-1 pb-3 text-left">
      <IconMarkerFill className="size-[18px] text-red-500" />
      {isLocating ? (
        <span className="text-text-soft text-[16px] font-bold tracking-[-0.2px]">위치 확인 중…</span>
      ) : (
        <span className="text-[16px] font-bold tracking-[-0.2px]">{label}</span>
      )}
      <IconChevronDownLine className="text-icon-strong size-3.5" />
    </button>
  )
}

/* ─── Hero Carousel ─── */
const SWIPE_VELOCITY_THRESHOLD = 500
const SWIPE_OFFSET_RATIO = 0.2 // 컨테이너 너비의 20% 이상 끌어야 슬라이드 전환
const SLIDE_SPRING = { type: 'spring' as const, stiffness: 300, damping: 35, mass: 0.8 }

function HeroCarousel({
  banners,
  index,
  onIndexChange,
  onDragStart,
  onDragEnd
}: {
  banners: HeroBanner[]
  index: number
  onIndexChange: (next: number) => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const x = useMotionValue(0)

  // 컨테이너 너비 측정 (마운트 + 리사이즈)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 외부 index 변경(autoplay 포함) 시 슬라이드 위치로 animate
  useEffect(() => {
    if (!containerWidth) return
    animate(x, -index * containerWidth, SLIDE_SPRING)
  }, [index, x, containerWidth])

  const handleDragEnd = useCallback(
    (_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      onDragEnd()
      const offset = info.offset.x
      const velocity = info.velocity.x
      const swipeThreshold = Math.max(containerWidth * SWIPE_OFFSET_RATIO, 60)

      let next = index
      if (offset < -swipeThreshold || velocity < -SWIPE_VELOCITY_THRESHOLD) {
        next = Math.min(index + 1, banners.length - 1)
      } else if (offset > swipeThreshold || velocity > SWIPE_VELOCITY_THRESHOLD) {
        next = Math.max(index - 1, 0)
      }

      if (next !== index) {
        onIndexChange(next)
        // useEffect가 next 위치로 animate. 즉시 animate도 호출해 시각적 지연 제거.
        animate(x, -next * containerWidth, SLIDE_SPRING)
      } else {
        // index 미변경 → 현재 슬라이드 위치로 명시적 스냅 (모멘텀 어중간한 위치 방지)
        animate(x, -index * containerWidth, SLIDE_SPRING)
      }
    },
    [banners.length, containerWidth, index, onDragEnd, onIndexChange, x]
  )

  if (!banners.length) {
    return (
      <div className="px-5">
        <div className="bg-bg-soft h-[180px] animate-pulse rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="relative px-5">
      <div ref={containerRef} className="touch-pan-y overflow-hidden rounded-2xl">
        <motion.div
          className="flex"
          style={{ x }}
          drag={banners.length > 1 ? 'x' : false}
          dragConstraints={{ left: -(banners.length - 1) * containerWidth, right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={onDragStart}
          onDragEnd={handleDragEnd}
        >
          {banners.map((b) => (
            <div key={b.id} className="w-full shrink-0" style={{ width: containerWidth || '100%' }}>
              {b.image ? (
                <div className="relative h-[180px] overflow-hidden" style={{ background: 'var(--color-brand-50)' }}>
                  <img
                    src={b.image}
                    alt={b.title}
                    draggable={false}
                    className="h-full w-full object-contain select-none"
                  />
                </div>
              ) : (
                <div
                  className="relative flex h-[180px] flex-col justify-between overflow-hidden p-5"
                  style={{ background: b.background }}
                >
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-[20px] leading-[1.3] font-extrabold tracking-[-0.3px] whitespace-pre-line text-white">
                      {b.title}
                    </h2>
                    {b.subtitle && <p className="text-[13px] leading-[1.4] font-medium text-white/85">{b.subtitle}</p>}
                  </div>
                  {b.decorEmoji && (
                    <div className="flex items-end justify-between">
                      <span className="text-[44px] leading-none">{b.decorEmoji}</span>
                    </div>
                  )}
                  <span aria-hidden className="absolute -top-10 -right-10 size-32 rounded-full bg-white/15 blur-2xl" />
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
      {/* 페이지 인디케이터 */}
      <span className="absolute right-8 bottom-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-semibold text-white">
        {index + 1} / {banners.length}
      </span>
    </div>
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
            <span className="text-[24px] leading-none">{it.emoji}</span>
          </span>
        )}
        {it.badge && (
          <span className="absolute -top-1 -right-0.5 flex h-[18px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-extrabold text-white">
            {it.badge}
          </span>
        )}
      </span>
      <span className="text-text-strong text-[11px] leading-tight font-medium tracking-[-0.2px]">{it.label}</span>
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

/* ─── 어디로 가시나요? (라운드 지역 카드) ─── */
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
        <h2 className="text-text-strong text-[18px] font-bold tracking-[-0.3px]">
          지역 <span className="text-primary">BEST</span>
        </h2>
        <button
          onClick={onNearby}
          className="bg-primary text-static-white flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
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
        {!region.image && <span className="text-[36px] leading-none">{region.emoji}</span>}
        {region.badge && (
          <span className="text-primary relative z-10 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] leading-none font-bold">
            {region.badge}
          </span>
        )}
        {!region.image && (
          <span aria-hidden className="absolute -top-4 -right-4 size-12 rounded-full bg-white/20 blur-xl" />
        )}
      </div>
      <span className="text-text-strong text-[12px] leading-tight font-semibold tracking-[-0.2px]">{region.name}</span>
    </motion.button>
  )
})

/* ─── 인기 주차장 BEST (사진 가로 스크롤) ─── */
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
        <h2 className="text-text-strong text-[18px] font-bold tracking-[-0.3px]">
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
                    <span className="absolute top-2 left-2 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-text-strong truncate text-[12px] leading-tight font-semibold tracking-[-0.2px]">
                    {p.name}
                  </span>
                  <span className="text-text-sub -mt-0.5 text-[11px] leading-none">{p.areaLabel}</span>
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
            <span className="text-[40px]">🎉</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-text-strong text-[17px] font-bold">후기가 등록되었어요!</span>
              <span className="text-text-soft text-[13px]">소중한 리뷰 감사합니다</span>
            </div>
            <button
              onClick={onClose}
              className="bg-primary mt-2 rounded-full px-8 py-3 text-[14px] font-semibold text-white"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-text-strong text-[16px] font-bold">후기 남기기</span>
            </div>

            <div className="flex flex-col gap-4 px-5 pb-2">
              {/* 별점 */}
              <div className="flex flex-col items-center gap-2.5 py-2">
                <span className="text-text-sub text-[13px]">이용하신 주차장은 어떠셨나요?</span>
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
                  className={`text-[13px] font-medium transition-opacity ${rating > 0 ? 'text-primary opacity-100' : 'opacity-0'}`}
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
                  className="border-stroke-soft bg-bg-soft text-text-strong placeholder:text-text-disabled w-full resize-none rounded-2xl border px-4 py-3 text-[14px] leading-relaxed outline-none"
                />
                <span className="text-text-disabled absolute right-3 bottom-3 text-[11px]">{text.length}/300</span>
              </div>

              {/* 등록 버튼 */}
              <button
                onClick={() => rating > 0 && setSubmitted(true)}
                className={`w-full rounded-2xl py-3.5 text-[15px] font-bold transition-colors ${
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
        <h2 className="text-text-strong flex items-center gap-1.5 text-[18px] font-bold tracking-[-0.3px]">
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
        <span className="text-text-soft text-[11px]">이번 주</span>
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
        className={`w-5 shrink-0 text-center text-[13px] leading-none font-extrabold tabular-nums ${
          isTop3 ? 'text-primary' : 'text-text-disabled'
        }`}
      >
        {keyword.rank}
      </span>
      <span className="text-text-strong min-w-0 flex-1 truncate text-[14px] leading-none font-medium tracking-[-0.2px]">
        {keyword.keyword}
      </span>
      <KeywordTrendBadge trend={trend} delta={delta} />
    </motion.button>
  )
})

function KeywordTrendBadge({ trend, delta }: { trend: 'up' | 'down' | 'flat'; delta: number }) {
  if (trend === 'flat') {
    return <span className="text-text-disabled text-[11px] leading-none tabular-nums">—</span>
  }
  const isUp = trend === 'up'
  return (
    <span className="text-text-sub flex shrink-0 items-center gap-0.5 text-[11px] leading-none font-semibold tabular-nums">
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
    <footer className="bg-bg-weak mt-2.5 px-5 py-6">
      <div className="flex flex-col gap-2">
        <p className="text-text-sub text-[12px] font-semibold">(주) 쏘카</p>

        <div className="flex flex-col gap-1">
          {[
            '통신판매업 신고: 제 2019-제주오라-3호',
            '사업자등록번호: 616-81-90529, 대표자: 박재욱',
            '서비스 문의 번호: 1899-8242, Fax: 02-6969-9333',
            '주소: 제주특별자치도 제주시 공항서로 141 (도두이동)'
          ].map((text) => (
            <p key={text} className="text-text-soft text-[11px] leading-relaxed">
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
                className="text-text-sub text-[11px] font-medium underline underline-offset-2"
              >
                {item.label}
              </Link>
              {i < arr.length - 1 && <span className="bg-stroke-sub mx-2 inline-block h-2.5 w-px" />}
            </span>
          ))}
        </div>

        <p className="text-text-soft text-[11px]">© 2026 SOCAR Inc. All rights reserved.</p>
      </div>
    </footer>
  )
}
