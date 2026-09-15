'use client'

import {
  IconCardLine,
  IconCautionFill,
  IconCarFill,
  IconChevronDownLine,
  IconChevronLeftLine,
  IconChevronRightLine,
  IconCopyLine,
  IconMarkerLine,
  IconNaviFill,
  IconPhoneLine,
  IconThumbsDownLine,
  IconThumbsUpLine
} from '@socar-inc/modu-ui/icons'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import AnimationSheet, { type SheetSnap } from '@/shared/components/ui/AnimationSheet'
import Toast from '@/shared/components/ui/Toast'
import { useFavorites } from '@/shared/hooks/useFavorites'

import { formatModifyDate } from '@/shared/lib/date'

import type { RecommendParking } from '@/app/p/[id]/viewmodel'

import type { ParkingLotType, TicketListItem } from '@/shared/types/parking'
import { CategorySeq, CouponTypeGroup } from '@/shared/types/parking'

import { useParkingDetailViewModel, useRecommendParkingViewModel } from '@/app/p/[id]/viewmodel'

export interface ParkingDetailData {
  seq: number
  name: string
  isPartner?: boolean
  parkingType?: ParkingLotType
}

interface ParkingDetailSheetProps {
  isOpen: boolean
  snap: SheetSnap
  onSnapChange: (s: SheetSnap) => void
  onClose: () => void
  data: ParkingDetailData | null
  onLocationKnown?: (lat: number, lng: number) => void
  /** true면 시트 마운트 시 슬라이드업 애니메이션 생략 (예: hash로 #sheet=full 진입) */
  skipMountAnimation?: boolean
}

type SheetTab = 'info' | 'recommend' | 'nearby'
const SHEET_TABS: { key: SheetTab; label: string }[] = [
  { key: 'info', label: '정보' },
  { key: 'recommend', label: '추천' },
  { key: 'nearby', label: '주변' }
]

export default function ParkingDetailSheet({
  isOpen,
  snap,
  onSnapChange,
  onClose,
  data,
  onLocationKnown,
  skipMountAnimation = false
}: ParkingDetailSheetProps) {
  const vm = useParkingDetailViewModel(data?.seq ?? null, data?.parkingType)
  const tabsRef = useRef<HTMLDivElement>(null)
  const infoSectionRef = useRef<HTMLDivElement>(null)
  const recommendSectionRef = useRef<HTMLDivElement>(null)
  const nearbySectionRef = useRef<HTMLDivElement>(null)
  const heroSliderRef = useRef<HTMLDivElement>(null)
  const isScrollingByClickRef = useRef(false)

  const [activeSection, setActiveSection] = useState<SheetTab>('info')
  const [showNavTitle, setShowNavTitle] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [toastMsg, setToastMsg] = useState<{ id: number; message: string } | null>(null)
  const [erroredSrcs, setErroredSrcs] = useState<Set<string>>(new Set())

  const showToast = useCallback((message: string) => {
    setToastMsg({ id: Date.now(), message })
  }, [])

  const handleCopyAddress = useCallback(
    async (address: string) => {
      try {
        await navigator.clipboard.writeText(address)
        showToast('주소가 복사되었어요')
      } catch {
        showToast('복사에 실패했어요')
      }
    },
    [showToast]
  )

  const sectionRefs = useMemo<Record<SheetTab, React.RefObject<HTMLDivElement | null>>>(
    () => ({
      info: infoSectionRef,
      recommend: recommendSectionRef,
      nearby: nearbySectionRef
    }),
    []
  )

  const getScrollContainer = useCallback((): HTMLElement | null => {
    const el = tabsRef.current
    if (!el) return null
    let container: HTMLElement | null = el.parentElement
    while (container) {
      if (container.hasAttribute('data-sheet-scroll-body')) return container
      container = container.parentElement
    }
    return null
  }, [])

  const scrollToSection = useCallback(
    (key: SheetTab) => {
      const container = getScrollContainer()
      const target = sectionRefs[key].current
      if (!container || !target) return
      const tabsHeight = tabsRef.current?.offsetHeight ?? 0

      isScrollingByClickRef.current = true
      setActiveSection(key)
      container.scrollTo({ top: target.offsetTop - tabsHeight, behavior: 'smooth' })

      let timer: ReturnType<typeof setTimeout>
      const onScroll = () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          isScrollingByClickRef.current = false
          container.removeEventListener('scroll', onScroll)
        }, 100)
      }
      container.addEventListener('scroll', onScroll, { passive: true })
    },
    [getScrollContainer, sectionRefs]
  )

  // Scrollspy
  useEffect(() => {
    if (!isOpen) return
    const container = getScrollContainer()
    const tabsEl = tabsRef.current
    if (!container || !tabsEl) return

    const tabsHeight = tabsEl.offsetHeight
    const entries = (Object.keys(sectionRefs) as SheetTab[])
      .map((key) => ({ key, el: sectionRefs[key].current }))
      .filter((e): e is { key: SheetTab; el: HTMLDivElement } => e.el !== null)

    const observer = new IntersectionObserver(
      (obs) => {
        if (isScrollingByClickRef.current) return
        obs.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute('data-section') as SheetTab | null
            if (key) setActiveSection(key)
          }
        })
      },
      { root: container, rootMargin: `-${tabsHeight}px 0px -80% 0px`, threshold: 0 }
    )

    entries.forEach(({ key, el }) => {
      el.setAttribute('data-section', key)
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [isOpen, getScrollContainer, sectionRefs])

  // 새 주차장 → 초기화
  useEffect(() => {
    const container = getScrollContainer()
    if (container) container.scrollTop = 0
    setActiveSection('info')
    setSlideIndex(0)
  }, [data?.seq, getScrollContainer])

  // snap 변경 시 NavBar 타이틀 리셋 + 스크롤 위치 리셋
  useEffect(() => {
    if (!isOpen || snap !== 'full') {
      setShowNavTitle(false)
      const container = getScrollContainer()
      if (container) container.scrollTop = 0
    }
  }, [isOpen, snap, getScrollContainer])

  // Full 상태 스크롤 → NavBar 타이틀 토글 (히어로 높이 기준)
  useEffect(() => {
    if (!isOpen || snap !== 'full') return
    const container = getScrollContainer()
    if (!container) return
    const THRESHOLD = 220
    const update = () => setShowNavTitle(container.scrollTop > THRESHOLD)
    update()
    container.addEventListener('scroll', update, { passive: true })
    return () => container.removeEventListener('scroll', update)
  }, [isOpen, snap, getScrollContainer])

  // Hero slider counter — 슬라이더 DOM이 detail 로드 후 마운트되므로
  // photos 길이를 dep에 포함시켜 리스너가 실제 렌더 시점에 부착되도록 함
  const photosLen = vm.detail?.basic.photos?.length ?? 0
  useEffect(() => {
    const slider = heroSliderRef.current
    if (!slider) return
    const onScroll = () => {
      const w = slider.offsetWidth
      if (w > 0) setSlideIndex(Math.round(slider.scrollLeft / w))
    }
    slider.addEventListener('scroll', onScroll, { passive: true })
    return () => slider.removeEventListener('scroll', onScroll)
  }, [data?.seq, photosLen])

  // 좌표 전달
  const lat = vm.detail?.basic.latitude
  const lng = vm.detail?.basic.longitude
  useEffect(() => {
    if (lat != null && lng != null) onLocationKnown?.(lat, lng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  const { favorites, toggle: toggleFavorite } = useFavorites()

  const sortedTickets = useMemo(
    () =>
      [...vm.tickets].sort((a, b) => {
        const ad = a.isSoldOut || !a.isOpen
        const bd = b.isSoldOut || !b.isOpen
        if (ad !== bd) return ad ? 1 : -1
        return a.price - b.price
      }),
    [vm.tickets]
  )

  if (!data) return null

  const detail = vm.detail
  const displayName = detail?.basic.name ?? data.name
  const isPartner = detail?.basic.partnerStatus ?? data.isPartner ?? false
  const capacity = detail?.basic.qty ?? null
  const isFavorited = favorites.some((f) => f.seq === data.seq)

  const getCategoryLabel = () => {
    if (isPartner) return '제휴'
    if (detail?.basic.category === CategorySeq.PUBLIC) return '공영'
    return '민영'
  }

  const handleToggleFavorite = () => {
    toggleFavorite({
      seq: data.seq,
      name: displayName,
      areaLabel: detail?.basic.newAddress || detail?.basic.address,
      image: detail?.basic.photos?.[0]?.file_name,
      isPartner: data.isPartner ?? !!detail?.basic.partnerStatus
    })
  }

  const heroImages = detail?.basic.photos ?? []
  const moduComment = detail?.basic.moduComment

  const openNavigation = () => {
    if (!detail) return
    const { latitude: lt, longitude: ln, name } = detail.basic
    window.location.href = `nmap://route/car?dlat=${lt}&dlng=${ln}&dname=${encodeURIComponent(name)}&appname=kr.modu.app`
  }

  return (
    <AnimationSheet
      isOpen={isOpen}
      snap={snap}
      onSnapChange={onSnapChange}
      onClose={onClose}
      peekHeight={96}
      halfRatio={0.45}
      skipMountAnimation={skipMountAnimation}
      navigationBar={<NavigationBar title={displayName} showTitle={showNavTitle} onBack={onClose} />}
      peek={
        snap !== 'full' ? (
          <PeekBar
            name={displayName}
            typeLabel={detail ? getCategoryLabel() : data.isPartner ? '제휴' : null}
            capacity={capacity}
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={openNavigation}
          />
        ) : null
      }
      overlay={
        <button
          onClick={onClose}
          className="bg-primary text-static-white shadow-02 pointer-events-auto flex h-11 items-center gap-1.5 rounded-full px-5 text-[14px] font-semibold"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
          </svg>
          지도보기
        </button>
      }
    >
      <div className="flex min-h-full flex-col">
        {/* ── Hero Image Slider ── */}
        <div className="bg-bg-soft relative h-[260px] w-full overflow-hidden">
          {heroImages.length === 0 ? (
            <HeroPlaceholder />
          ) : (
            <>
              <div
                ref={heroSliderRef}
                className="scrollbar-hide flex h-full w-full overflow-x-scroll"
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              >
                {heroImages.map((photo, i) => (
                  <div
                    key={i}
                    className="relative h-full w-full shrink-0"
                    style={{ scrollSnapAlign: 'start' } as React.CSSProperties}
                  >
                    {erroredSrcs.has(photo.file_name) ? (
                      <HeroPlaceholder />
                    ) : (
                      <Image
                        src={photo.file_name}
                        alt={`${displayName} 이미지 ${i + 1}`}
                        fill
                        sizes="480px"
                        className="object-cover"
                        onError={() =>
                          setErroredSrcs((prev) => {
                            if (prev.has(photo.file_name)) return prev
                            const next = new Set(prev)
                            next.add(photo.file_name)
                            return next
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              {heroImages.length > 1 && (
                <div className="pointer-events-none absolute right-3 bottom-3 flex h-6 min-w-[43px] items-center justify-center rounded-full bg-black/50 px-2">
                  <span className="text-[11px] font-medium text-white">
                    {slideIndex + 1}/{heroImages.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Title + CommentSection (full 상태에서만) ── */}
        {snap === 'full' && (
          <div className={`bg-bg-white px-4 pt-5 pb-4`}>
            {/* 타이틀 */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-text-strong text-[18px] leading-snug font-bold">{displayName}</h2>
                <div className="text-text-sub mt-1 flex items-center gap-1.5 text-[13px]">
                  <span>{getCategoryLabel()}</span>
                  {capacity !== null && (
                    <>
                      <svg width="3" height="3" viewBox="0 0 3 3" fill="none">
                        <circle cx="1.5" cy="1.5" r="1.5" fill="var(--color-icon-soft)" />
                      </svg>
                      <span>{capacity.toLocaleString()}면</span>
                    </>
                  )}
                  {(getCategoryLabel() || capacity !== null) && <span className="text-stroke-sub mx-0.5">|</span>}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite()
                    }}
                    aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    className="flex shrink-0 cursor-pointer items-center transition-transform active:scale-90"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/icn_favorite.webp"
                      alt=""
                      width={20}
                      height={20}
                      draggable={false}
                      className={`size-5 object-contain transition-[filter,opacity] ${isFavorited ? '' : 'opacity-50 grayscale'}`}
                    />
                  </button>
                </div>
              </div>
              <button
                type="button"
                aria-label="길찾기"
                onClick={openNavigation}
                className="bg-primary text-static-white flex size-[53px] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[8px]"
              >
                <IconNaviFill className="size-5" />
                <span className="text-[10px] font-medium tracking-[0.3px]">길찾기</span>
              </button>
            </div>
            {/* CommentSection — 주차권 없는 경우만 */}
            {(!isPartner || sortedTickets.length === 0) && (
              <div className="bg-bg-soft mt-3.5 rounded-md px-5 py-2 text-center">
                <p className="text-text-sub text-[13px]">아직 주차권을 판매하지 않는 현장입니다.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Ticket stub cards ── moduComment는 full 상태에서만 노출 (peek/half에서 가시 영역 절약) */}
        {isPartner && sortedTickets.length > 0 && (
          <TicketList
            tickets={sortedTickets}
            onTicketClick={(seq) => vm.goToTicketDetail(seq)}
            moduComment={snap === 'full' ? moduComment || undefined : undefined}
          />
        )}

        {/* ── Section divider ── */}
        <div className="bg-bg-weak h-2.5" />

        {/* ── Scrollspy tabs ── */}
        <div ref={tabsRef} className="border-stroke-soft bg-bg-white sticky top-0 z-10 border-b">
          <div className="flex">
            {SHEET_TABS.map((tab) => {
              const isActive = tab.key === activeSection
              return (
                <button
                  key={tab.key}
                  onClick={() => scrollToSection(tab.key)}
                  className={`flex flex-1 items-end justify-center pt-[14px] pb-0 transition-colors ${
                    isActive ? 'text-text-strong' : 'text-text-disabled'
                  }`}
                >
                  <span className="inline-flex flex-col items-stretch gap-[10px]">
                    <span className="text-[15px] leading-none font-semibold">{tab.label}</span>
                    <span className={`h-1 rounded-full ${isActive ? 'bg-primary' : 'invisible'}`} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Info section ── */}
        <div ref={infoSectionRef} className="bg-bg-white">
          <InfoTab
            detail={detail}
            isLoading={vm.isLoading}
            onCopyAddress={handleCopyAddress}
            formatCurrentFee={vm.formatCurrentFee}
          />
        </div>
        <div className="bg-bg-weak h-2.5" />

        {/* ── Recommend section ── */}
        <div ref={recommendSectionRef} className="bg-bg-white">
          <RecommendTab seq={data.seq} lat={detail?.basic.latitude} lng={detail?.basic.longitude} />
        </div>
        <div className="bg-bg-weak h-2.5" />

        {/* ── Nearby section ── */}
        <div ref={nearbySectionRef} className="bg-bg-white">
          <NearbyTab detail={detail} />
        </div>

        <Footer />
      </div>
      <Toast id={toastMsg?.id} message={toastMsg?.message ?? null} onDismiss={() => setToastMsg(null)} />
    </AnimationSheet>
  )
}

/* ─── NavigationBar ─── */
function NavigationBar({ title, showTitle, onBack }: { title: string; showTitle: boolean; onBack: () => void }) {
  return (
    <div className="flex h-12 items-center justify-between px-2">
      <button onClick={onBack} className="flex size-10 cursor-pointer items-center justify-center">
        <IconChevronLeftLine className="text-icon-strong size-[22px]" />
      </button>
      <h2
        className={`text-text-strong truncate px-2 text-[16px] font-bold transition-opacity duration-200 ${
          showTitle ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!showTitle}
      >
        {title}
      </h2>
      <div className="size-10" />
    </div>
  )
}

/* ─── PeekBar (모든 snap 상태에서 고정 노출) ─── */
function PeekBar({
  name,
  typeLabel,
  capacity,
  isFavorited,
  onToggleFavorite,
  onNavigate
}: {
  name: string
  typeLabel: string | null
  capacity: number | null
  isFavorited: boolean
  onToggleFavorite: () => void
  onNavigate: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-5">
      <div className="min-w-0 flex-1">
        <h3 className="text-text-strong truncate text-[18px] leading-[1.4] font-bold">{name}</h3>
        <div className="text-text-sub mt-0.5 flex items-center gap-1.5 text-[14px]">
          {typeLabel && <span>{typeLabel}</span>}
          {typeLabel && capacity !== null && (
            <svg width="4" height="4" viewBox="0 0 4 4" fill="none">
              <circle cx="2" cy="2" r="2" fill="var(--color-icon-soft)" />
            </svg>
          )}
          {capacity !== null && <span>{capacity.toLocaleString()}면</span>}
          {(typeLabel || capacity !== null) && <span className="text-stroke-sub">|</span>}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className="flex shrink-0 cursor-pointer items-center transition-transform active:scale-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/icn_favorite.webp"
              alt=""
              width={20}
              height={20}
              draggable={false}
              className={`size-5 object-contain transition-[filter,opacity] ${isFavorited ? '' : 'opacity-50 grayscale'}`}
            />
          </button>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onNavigate()
        }}
        className="bg-primary text-static-white flex size-[53px] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[8px]"
      >
        <IconNaviFill className="size-5" />
        <span className="text-[10px] font-medium tracking-[0.3px]">길찾기</span>
      </button>
    </div>
  )
}

/* ─── TicketList ─── */
const TICKET_PREVIEW_COUNT = 3

function TicketList({
  tickets,
  onTicketClick,
  moduComment
}: {
  tickets: TicketListItem[]
  onTicketClick: (seq: number) => void
  moduComment?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = tickets.length > TICKET_PREVIEW_COUNT
  const visible = expanded ? tickets : tickets.slice(0, TICKET_PREVIEW_COUNT)

  return (
    <div className="bg-bg-white px-4 pb-4">
      {moduComment && (
        <div className="bg-brand-50 mb-3 rounded-md px-5 py-2 text-center">
          <p className="text-text-strong text-[13px]">{moduComment}</p>
        </div>
      )}
      <div className="flex flex-col gap-2.5 pt-4">
        {visible.map((ticket) => (
          <TicketStubCard key={ticket.couponSeq} ticket={ticket} onSelect={onTicketClick} />
        ))}
      </div>
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="border-primary/20 text-primary mt-2.5 flex h-[48px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border bg-white text-[14px] font-semibold shadow-[0_2px_10px_rgba(59,130,246,0.09)] transition-all hover:shadow-[0_2px_14px_rgba(59,130,246,0.14)] active:scale-[0.99]"
        >
          전체보기
          <span className="text-primary/60 text-[13px] font-medium">({tickets.length}개)</span>
          <IconChevronDownLine className="ml-0.5 size-4" />
        </button>
      )}
    </div>
  )
}

/* ─── TicketStubCard ─── */
const TicketStubCard = memo(function TicketStubCard({
  ticket,
  onSelect
}: {
  ticket: TicketListItem
  onSelect: (couponSeq: number) => void
}) {
  const isDisabled = ticket.isSoldOut || !ticket.isOpen
  const isSoldOut = ticket.isSoldOut
  const isComingSoon = !ticket.isOpen && !ticket.isSoldOut
  // 100,000원 이상이면 폰트 다운그레이드 (1,000,000 같은 큰 숫자 안전)
  const isLarge = ticket.price >= 100000

  const statusLabel = isSoldOut ? '매진' : isComingSoon ? '판매예정' : '구매가능'
  const statusColor = isSoldOut ? 'bg-neutral-300' : isComingSoon ? 'bg-yellow-500' : 'bg-mint-700'

  const descLine =
    ticket.isOpen || Number(ticket.couponTypeGroup) === CouponTypeGroup.MONTHLY
      ? `${ticket.usingDateLabel} ${ticket.usingTimeLabel}`
      : ticket.nextTimeLabel

  // 카드/연결부 bg는 활성/비활성 모두 흰색으로 통일 — disabled는 border + 텍스트로만 구분
  // (disabled에 gray bg를 주면 가운데 연결부가 회색 스트립처럼 보여 어색함)
  const cardBg = 'bg-white'
  const cardBorder = isDisabled ? 'border-slate-200' : 'border-primary/20'
  const cardShadow = isDisabled ? '' : 'shadow-[0_2px_10px_rgba(59,130,246,0.09)]'
  const dashBorder = 'border-primary/45'

  return (
    <div
      className={`relative w-full ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={() => !isDisabled && onSelect(ticket.couponSeq)}
    >
      {/* 3분할: [정보] · [연결부 (카드 bg와 동일)] · [가격]
       *  - 연결부 bg를 카드 bg와 일치 → 색 단절 없이 매끈하게 이어짐
       *  - 노치는 border + 카드 bg fill로 카드 영역과 자연스럽게 연결 */}
      <div className="flex h-[86px] w-full">
        {/* 왼쪽: 정보 영역 */}
        <div
          className={`flex flex-1 flex-col justify-center gap-1 rounded-l-2xl border-y border-l px-4 ${cardBg} ${cardBorder} ${cardShadow}`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${statusColor}`} />
            <span className={`text-[11px] font-medium ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>
              {statusLabel}
            </span>
          </div>
          <p
            className={`truncate text-[15px] leading-tight font-bold ${isDisabled ? 'text-slate-400' : 'text-slate-800'}`}
          >
            {ticket.couponName}
          </p>
          {descLine && (
            <p className={`truncate text-[11px] ${isDisabled ? 'text-slate-300' : 'text-slate-400'}`}>{descLine}</p>
          )}
        </div>

        {/* 가운데 연결부 — bg는 카드와 일치(상태별), 점선만 별도 색상 */}
        <div className={`relative w-5 shrink-0 ${cardBg}`}>
          {/* 상단 반원 노치 — bg를 카드 bg로 채워서 카드 영역과 매끈하게 이어짐 */}
          <div
            className={`absolute -top-[1px] left-0 h-[9px] w-full rounded-b-full border-x border-b ${cardBorder} ${cardBg}`}
          />
          {/* 점선 */}
          <div className={`absolute inset-y-2.5 left-1/2 w-px -translate-x-1/2 border-l border-dashed ${dashBorder}`} />
          {/* 하단 반원 노치 */}
          <div
            className={`absolute -bottom-[1px] left-0 h-[9px] w-full rounded-t-full border-x border-t ${cardBorder} ${cardBg}`}
          />
        </div>

        {/* 오른쪽: 가격 영역 — 고정폭(컴팩트), 큰 금액(1M+)은 폰트 다운그레이드 */}
        <div
          className={`flex w-[92px] shrink-0 flex-col items-center justify-center gap-1 rounded-r-2xl border-y border-r px-2 ${cardBg} ${cardBorder} ${cardShadow}`}
        >
          <p
            className={`leading-none font-bold tracking-tight whitespace-nowrap ${
              isLarge ? 'text-[15px]' : 'text-[18px]'
            } ${isDisabled ? 'text-slate-300' : 'text-primary'}`}
          >
            {ticket.price.toLocaleString()}
            <span className={`ml-0.5 text-[11px] font-medium ${isDisabled ? 'text-slate-300' : 'text-primary/80'}`}>
              원
            </span>
          </p>
          {!isDisabled && <span className="text-primary/60 text-[11px] font-medium">구매하기 ›</span>}
        </div>
      </div>
    </div>
  )
})

/* ─── Hero Placeholder — 이미지 없거나 로드 실패 시 표출 ─── */
function HeroPlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: 'linear-gradient(135deg, var(--color-brand-50) 0%, var(--color-brand-100) 100%)' }}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="bg-bg-white/70 flex size-16 items-center justify-center rounded-2xl shadow-sm">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="9" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M3 17l4-4 3 2 5-5 6 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-text-soft text-[12px]">이미지 준비중</span>
      </div>
    </div>
  )
}

/* ─── InfoTab ─── */
function InfoTab({
  detail,
  isLoading,
  onCopyAddress,
  formatCurrentFee
}: {
  detail: ReturnType<typeof useParkingDetailViewModel>['detail']
  isLoading: boolean
  onCopyAddress: (addr: string) => void
  formatCurrentFee: (prices: Record<string, number>) => string | null
}) {
  if (isLoading && !detail) {
    return (
      <div className="flex flex-col gap-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-bg-soft h-20 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }
  if (!detail) return null

  const { basic, times, prices, modifyDate, openFree } = detail
  const currentFee = formatCurrentFee(basic.calcPrices)
  const address = basic.newAddress || basic.address
  const operationTime = openFree.operationTime?.replace(/익일\s*/g, '') ?? null

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {modifyDate && (
        <div className="flex items-center justify-end gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-icon-soft">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-text-disabled text-[12px]">정보 업데이트: {formatModifyDate(modifyDate)}</span>
        </div>
      )}

      {/* 주소 — 최상단 */}
      {address && (
        <InfoCard icon={<IconMarkerLine className="size-5" />} title="주소">
          <button
            className="flex w-full min-w-0 cursor-pointer items-center gap-1 text-left"
            onClick={() => onCopyAddress(address)}
          >
            <span className="text-text-strong flex-1 text-[13px]">{address}</span>
            <IconCopyLine className="text-icon-soft size-3.5 shrink-0" />
          </button>
        </InfoCard>
      )}

      {/* 요금 안내 */}
      {prices.length > 0 && prices[0].contents.length > 0 && (
        <InfoCard icon={<IconCardLine className="size-5" />} title="요금 안내">
          <div className="flex flex-col gap-2">
            {prices[0].contents.slice(0, 4).map((item, idx) => (
              <div key={`price-${idx}`} className="flex items-center justify-between gap-3">
                <span className="text-text-sub text-[13px]">{item.key}</span>
                <span className="text-text-strong text-right text-[13px]">{item.value}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* 운영 시간 */}
      {times.length > 0 && times[0].contents.length > 0 && (
        <InfoCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
          title="운영 시간"
        >
          <div className="flex flex-col gap-2">
            {times[0].contents.map((item, idx) => (
              <div key={`time-${idx}`} className="flex items-center justify-between gap-3">
                <span className="text-text-sub text-[13px]">{item.key}</span>
                <span className="text-text-strong text-right text-[13px]">{item.value}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {/* 요약 요금/시간 — 상세 데이터 없을 때 fallback */}
      {(prices.length === 0 || prices[0].contents.length === 0) && currentFee && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-sub shrink-0 text-[14px]">현장 요금</span>
          <span className="text-text-strong text-right text-[14px]">{currentFee}</span>
        </div>
      )}
      {(times.length === 0 || times[0].contents.length === 0) && operationTime && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-sub shrink-0 text-[14px]">운영 시간</span>
          <span className="text-text-strong text-right text-[14px]">{operationTime}</span>
        </div>
      )}

      {/* 추가 정보 (options) */}
      {basic.options.length > 0 && (
        <InfoCard icon={<IconCarFill className="size-5" />} title="추가 정보">
          <div className="flex flex-wrap gap-2">
            {basic.options.map((opt) => (
              <span key={opt} className="bg-primary/10 text-primary rounded-full px-3 py-1.5 text-[12px] font-medium">
                {opt}
              </span>
            ))}
          </div>
        </InfoCard>
      )}

      {/* 주차장 번호 */}
      {basic.phone && (
        <InfoCard icon={<IconPhoneLine className="size-5" />} title="주차장번호">
          <a href={`tel:${basic.phone}`} className="text-primary text-[14px] font-medium">
            {basic.phone}
          </a>
        </InfoCard>
      )}

      {/* 주의사항 */}
      <div className="bg-caution-lighter flex items-start gap-3 rounded-xl p-4">
        <IconCautionFill className="mt-0.5 size-5 shrink-0 text-yellow-500" />
        <p className="text-caution-dark text-[12px] leading-relaxed">
          현장 정보와 일치하지 않아 발생한 피해는 모두의주차장이 책임을 지거나 보상하지 않습니다.
        </p>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border-stroke-soft flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <span className="text-text-strong text-[14px] font-bold">{title}</span>
      </div>
      {children}
    </div>
  )
}

/* ─── RecommendTab ─── */
function RecommendTab({ seq, lat, lng }: { seq: number; lat?: number; lng?: number }) {
  const { items, isLoaded } = useRecommendParkingViewModel({ seq, lat, lng })

  return (
    <div className="flex flex-col gap-3 px-4 py-6">
      <h2 className="text-text-strong text-[18px] font-bold">추천 주차장</h2>

      {!isLoaded ? (
        <div className="scrollbar-hide flex gap-3 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[290px] shrink-0">
              <div className="bg-bg-soft h-[180px] animate-pulse rounded-xl" />
              <div className="bg-bg-soft mt-3 h-5 w-3/4 animate-pulse rounded" />
              <div className="bg-bg-soft mt-2 h-4 w-1/2 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-text-soft py-6 text-center text-[14px]">주변에 추천할 주차장이 없습니다.</p>
      ) : (
        <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4">
          {items.map((item, i) => (
            <RecommendCard key={item.seq} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

const RecommendCard = memo(function RecommendCard({ item, index }: { item: RecommendParking; index: number }) {
  const firstTicket = item.tickets[0]
  const extraCount = item.tickets.length - 1

  return (
    <motion.div
      className="w-[290px] shrink-0"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35, ease: 'easeOut' }}
    >
      <Link href={`/p/${item.seq}#sheet=full`} className="flex flex-col gap-3">
        <div className="h-[180px] w-full overflow-hidden rounded-xl">
          {item.photos.length > 0 ? (
            <div className="scrollbar-hide flex h-full snap-x snap-mandatory overflow-x-auto">
              {item.photos.map((src, i) => (
                <div key={i} className="relative h-full w-full shrink-0 snap-center">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="290px"
                    className="object-cover"
                    onError={(e) => {
                      const el = (e.target as HTMLElement).closest('.relative') as HTMLElement | null
                      if (el) el.style.display = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex size-full items-center justify-center bg-slate-200">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-slate-400">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M2 17l5-4 3 2 5-5 7 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex max-w-[180px] min-w-0 items-center gap-1">
            <span className="truncate text-[15px] font-bold text-slate-700">{item.name}</span>
            <IconChevronRightLine className="size-[15px] shrink-0 text-slate-600" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-[13px] text-slate-400">
            <span>{item.qty ? `${item.qty.toLocaleString()}면` : '정보없음'}</span>
            <span>·</span>
            <span>{item.distance >= 1000 ? `${(item.distance / 1000).toFixed(1)}km` : `${item.distance}m`}</span>
          </div>
        </div>

        {firstTicket && (
          <p className="text-primary truncate text-[13px] font-medium">
            {firstTicket.name} {firstTicket.price.toLocaleString()}원{extraCount > 0 && ` 외 ${extraCount}개`}
          </p>
        )}
      </Link>
    </motion.div>
  )
})

/* ─── NearbyTab ─── */
function NearbyTab({ detail }: { detail: ReturnType<typeof useParkingDetailViewModel>['detail'] }) {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null)

  if (!detail?.aiDescription) {
    return (
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-primary/10 flex items-center rounded-full px-2 py-0.5">
            <span className="text-primary text-[10px] font-bold">AI</span>
          </div>
          <span className="text-text-strong text-[15px] font-bold">주변 정보</span>
        </div>
        <p className="text-text-disabled text-[14px]">주변 정보가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-primary/10 flex items-center rounded-full px-2 py-0.5">
          <span className="text-primary text-[10px] font-bold">AI</span>
        </div>
        <span className="text-text-strong text-[15px] font-bold">주변 정보</span>
      </div>

      <div className="flex items-start gap-2.5">
        {/* AI 아바타 */}
        <div className="bg-primary/10 flex shrink-0 items-center justify-center overflow-hidden rounded-full p-1.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2a2 2 0 0 1 2 2v1h3a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
              fill="currentColor"
              className="text-primary"
            />
          </svg>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* 말풍선 */}
          <div className="border-stroke-soft from-bg-weak rounded-2xl rounded-tl-sm border bg-gradient-to-br to-slate-100 px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-text-strong text-[13px] leading-relaxed">{detail.aiDescription.response}</p>
            <div className="border-stroke-soft mt-2 border-t pt-2">
              <span className="text-text-disabled text-[11px]">AI가 작성한 정보로 실제와 다를 수 있어요</span>
            </div>
          </div>

          {/* 피드백 버튼 */}
          <div className="flex items-center gap-3">
            <span className="text-text-disabled text-[12px]">도움이 됐나요?</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={feedback === 'dislike'}
                onClick={() => setFeedback((prev) => (prev === 'like' ? null : 'like'))}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] leading-none font-medium transition-all ${
                  feedback === 'like'
                    ? 'bg-primary pointer-events-none text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                    : feedback !== null
                      ? 'bg-bg-soft text-text-disabled pointer-events-none'
                      : 'bg-primary/10 text-primary active:bg-primary/20'
                }`}
              >
                <IconThumbsUpLine className="size-[13px]" />
                추천
              </button>
              <button
                type="button"
                disabled={feedback === 'like'}
                onClick={() => setFeedback((prev) => (prev === 'dislike' ? null : 'dislike'))}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] leading-none font-medium transition-all ${
                  feedback === 'dislike'
                    ? 'bg-primary pointer-events-none text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                    : feedback !== null
                      ? 'bg-bg-soft text-text-disabled pointer-events-none'
                      : 'bg-bg-soft text-text-sub active:bg-bg-weak'
                }`}
              >
                <IconThumbsDownLine className="size-[13px]" />
                비추천
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <div className="bg-bg-soft px-4 py-6 pb-24">
      <button
        className="border-stroke-soft text-text-strong h-[38px] w-full rounded-lg border bg-white text-[13px] font-medium"
        onClick={() => window.open('https://l.modu.kr/main', '_blank')}
      >
        앱 다운로드하기
      </button>
      <div className="mt-6 flex flex-col gap-2">
        {[
          '(주) 쏘카',
          '통신판매업 신고: 제 2019-제주오라-3호',
          '사업자등록번호: 616-81-90529, 대표자: 박재욱',
          '서비스 문의 번호: 1899-8242, Fax: 02-6969-9333',
          '주소: 제주특별자치도 제주시 공항서로 141 (도두이동)'
        ].map((text) => (
          <p key={text} className="text-text-sub text-[11px] leading-[1.5]">
            {text}
          </p>
        ))}
        <div className="mt-1 flex items-center">
          {[
            { label: '이용약관', href: 'https://app.modu.kr/terms' },
            { label: '개인정보처리방침', href: 'https://app.modu.kr/privacy' },
            { label: '위치정보 이용약관', href: 'https://app.modu.kr/location' },
            { label: '고객센터', href: 'https://help.modu.kr' }
          ].map((item, i, arr) => (
            <span key={item.href} className="flex items-center">
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-sub text-[11px] underline underline-offset-2"
              >
                {item.label}
              </Link>
              {i < arr.length - 1 && <span className="border-stroke-sub mx-2 inline-block h-[8px] w-px border-l" />}
            </span>
          ))}
        </div>
        <hr className="border-stroke-soft mt-1" />
      </div>
    </div>
  )
}
