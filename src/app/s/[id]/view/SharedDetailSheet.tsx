'use client'

import {
  IconCardLine,
  IconCautionFill,
  IconCarFill,
  IconChevronLeftLine,
  IconCopyLine,
  IconMarkerLine,
  IconNaviFill,
  IconPhoneLine
} from '@socar-inc/modu-ui/icons'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import AnimationSheet, { type SheetSnap } from '@/shared/components/ui/AnimationSheet'
import Toast from '@/shared/components/ui/Toast'
import { useFavorites } from '@/shared/hooks/useFavorites'

import { useSharedDetailViewModel } from '../viewmodel'

import { DetailFooter, RecommendTab } from '@/app/(tabs)/map/view/ParkingDetailSheet'

interface SharedDetailSheetProps {
  seq: number
  isOpen: boolean
  snap: SheetSnap
  onSnapChange: (s: SheetSnap) => void
  onClose: () => void
  onLocationKnown?: (lat: number, lng: number) => void
  skipMountAnimation?: boolean
}

/**
 * 공유주차장 상세 시트 — modu-web-app /s 라우트(SharedParkinglot view) 기준 재구성.
 * 타이틀(공유·면수) → 주차 시작하기 CTA → 주소/요금/운영시간 → 추가 정보 → 추천 주차장 → 푸터.
 */
export default function SharedDetailSheet({
  seq,
  isOpen,
  snap,
  onSnapChange,
  onClose,
  onLocationKnown,
  skipMountAnimation = false
}: SharedDetailSheetProps) {
  const vm = useSharedDetailViewModel(seq)
  const heroSliderRef = useRef<HTMLDivElement>(null)
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

  // 공유주차장 결제 — pay 결제웹뷰로 위임 (제휴·공항과 동일 정책)
  const handleStartParking = vm.startPurchase

  // Hero slider counter
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
  }, [seq, photosLen])

  // 좌표 전달 (URL 직접 진입 시 지도 이동)
  const lat = vm.detail?.basic.latitude
  const lng = vm.detail?.basic.longitude
  useEffect(() => {
    if (lat != null && lng != null) onLocationKnown?.(lat, lng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  const { favorites, toggle: toggleFavorite } = useFavorites()

  const detail = vm.detail
  const displayName = detail?.basic.name ?? '공유주차장'
  const capacity = detail?.basic.qty ?? null
  const isFavorited = favorites.some((f) => f.seq === seq)

  const handleToggleFavorite = () => {
    toggleFavorite({
      seq,
      name: displayName,
      areaLabel: detail?.basic.newAddress || detail?.basic.address,
      image: detail?.basic.photos?.[0]?.file_name,
      isPartner: false
    })
  }

  const openNavigation = () => {
    if (!detail) return
    const { latitude: lt, longitude: ln, name } = detail.basic
    window.location.href = `nmap://route/car?dlat=${lt}&dlng=${ln}&dname=${encodeURIComponent(name)}&appname=kr.modu.app`
  }

  const heroImages = detail?.basic.photos ?? []
  const address = detail ? detail.basic.newAddress || detail.basic.address : null

  return (
    <AnimationSheet
      isOpen={isOpen}
      snap={snap}
      onSnapChange={onSnapChange}
      onClose={onClose}
      peekHeight={96}
      halfRatio={0.45}
      skipMountAnimation={skipMountAnimation}
      navigationBar={
        <div className="flex h-12 items-center justify-between px-2">
          <button onClick={onClose} className="flex size-10 cursor-pointer items-center justify-center">
            <IconChevronLeftLine className="text-icon-strong size-[22px]" />
          </button>
          <div className="size-10" />
        </div>
      }
      peek={
        snap !== 'full' ? (
          <div className="flex items-center justify-between gap-3 px-5 pt-1 pb-5">
            <div className="min-w-0 flex-1">
              <h3 className="text-text-strong text-t3 truncate font-bold">{displayName}</h3>
              <div className="text-text-sub text-b4 mt-0.5 flex items-center gap-1.5">
                <span>공유</span>
                {capacity !== null && (
                  <>
                    <svg width="4" height="4" viewBox="0 0 4 4" fill="none">
                      <circle cx="2" cy="2" r="2" fill="var(--color-icon-soft)" />
                    </svg>
                    <span>{capacity.toLocaleString()}면</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openNavigation()
              }}
              className="bg-primary text-static-white flex size-[53px] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[8px]"
            >
              <IconNaviFill className="size-5" />
              <span className="text-c4 font-medium">길찾기</span>
            </button>
          </div>
        ) : null
      }
    >
      <div className="flex min-h-full flex-col">
        {/* ── Hero Image Slider ── */}
        <div className="bg-bg-soft relative h-[260px] w-full overflow-hidden">
          {heroImages.length === 0 ? (
            <SharedHeroPlaceholder />
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
                      <SharedHeroPlaceholder />
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
                  <span className="text-c3 font-medium text-white">
                    {slideIndex + 1}/{heroImages.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Title + CTA ── */}
        <div className="bg-bg-white px-4 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-text-strong text-t3 font-bold">{displayName}</h2>
              <div className="text-text-sub text-b4 mt-1 flex items-center gap-1.5">
                <span>공유</span>
                {capacity !== null && (
                  <>
                    <svg width="3" height="3" viewBox="0 0 3 3" fill="none">
                      <circle cx="1.5" cy="1.5" r="1.5" fill="var(--color-icon-soft)" />
                    </svg>
                    <span>{capacity.toLocaleString()}면</span>
                  </>
                )}
                <span className="text-stroke-sub mx-0.5">|</span>
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
              <span className="text-c4 font-medium">길찾기</span>
            </button>
          </div>

          {/* 모두 코멘트 */}
          {detail?.basic.moduComment && (
            <div className="bg-brand-50 mt-3.5 rounded-md px-5 py-2 text-center">
              <p className="text-text-strong text-b4">{detail.basic.moduComment}</p>
            </div>
          )}

          {/* 주차 시작하기 CTA — modu-web-app /s 와 동일 카피 */}
          <button
            type="button"
            onClick={handleStartParking}
            className="bg-primary mt-3.5 flex h-14 w-full cursor-pointer flex-col items-center justify-center rounded-md"
          >
            <span className="text-static-white text-t5 font-semibold">주차 시작하기</span>
            <span className="text-static-white/85 text-c3">결제 직후 바로 주차가 시작 됩니다.</span>
          </button>
        </div>

        {/* ── Section divider ── */}
        <div className="bg-bg-weak h-2.5" />

        {/* ── 정보 ── */}
        <div className="bg-bg-white">
          {vm.isLoading && !detail ? (
            <div className="flex flex-col gap-4 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-bg-soft h-20 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4 px-4 py-5">
              {/* 주소 */}
              {address && (
                <SharedInfoCard icon={<IconMarkerLine className="size-5" />} title="주소">
                  <button
                    className="flex w-full min-w-0 cursor-pointer items-center gap-1 text-left"
                    onClick={() => handleCopyAddress(address)}
                  >
                    <span className="text-text-strong text-b4 flex-1">{address}</span>
                    <IconCopyLine className="text-icon-soft size-3.5 shrink-0" />
                  </button>
                </SharedInfoCard>
              )}

              {/* 요금 안내 — 60분 기준가 + 상세 rows */}
              {(vm.hourlyFeeLabel || vm.priceRows.length > 0) && (
                <SharedInfoCard icon={<IconCardLine className="size-5" />} title="요금 안내">
                  <div className="flex flex-col gap-2">
                    {vm.hourlyFeeLabel && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-text-sub text-b4">주차 요금</span>
                        <span className="text-text-strong text-b4 text-right">{vm.hourlyFeeLabel}</span>
                      </div>
                    )}
                    {vm.priceRows.map((item, idx) => (
                      <div key={`price-${idx}`} className="flex items-center justify-between gap-3">
                        <span className="text-text-sub text-b4">{item.key}</span>
                        <span className="text-text-strong text-b4 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </SharedInfoCard>
              )}

              {/* 운영 시간 — 일요일은 맨 뒤 */}
              {vm.operationTimeRows.length > 0 && (
                <SharedInfoCard
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  }
                  title="운영 시간"
                >
                  <div className="flex flex-col gap-2">
                    {vm.operationTimeRows.map((item, idx) => (
                      <div key={`time-${idx}`} className="flex items-center justify-between gap-3">
                        <span className="text-text-sub text-b4">{item.key}</span>
                        <span className="text-text-strong text-b4 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </SharedInfoCard>
              )}

              {/* 추가 정보 (options) */}
              {detail.basic.options.length > 0 && (
                <SharedInfoCard icon={<IconCarFill className="size-5" />} title="추가 정보">
                  <div className="flex flex-wrap gap-2">
                    {detail.basic.options.map((opt) => (
                      <span
                        key={opt}
                        className="bg-primary/10 text-primary text-c3 rounded-full px-3 py-1.5 font-medium"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </SharedInfoCard>
              )}

              {/* 주차장 번호 */}
              {detail.basic.phone && (
                <SharedInfoCard icon={<IconPhoneLine className="size-5" />} title="주차장번호">
                  <a href={`tel:${detail.basic.phone}`} className="text-primary text-c2 font-medium">
                    {detail.basic.phone}
                  </a>
                </SharedInfoCard>
              )}

              {/* 개별 유의사항 (caution) */}
              {detail.basic.caution && (
                <div className="bg-caution-lighter flex items-start gap-3 rounded-xl p-4">
                  <IconCautionFill className="mt-0.5 size-5 shrink-0 text-yellow-500" />
                  <p className="text-caution-dark text-b5 whitespace-pre-line">{detail.basic.caution}</p>
                </div>
              )}

              {/* 공통 면책 문구 */}
              <div className="bg-caution-lighter flex items-start gap-3 rounded-xl p-4">
                <IconCautionFill className="mt-0.5 size-5 shrink-0 text-yellow-500" />
                <p className="text-caution-dark text-b5">
                  현장 정보와 일치하지 않아 발생한 피해는 모두의주차장이 책임을 지거나 보상하지 않습니다.
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="bg-bg-weak h-2.5" />

        {/* ── 추천 주차장 ── */}
        <div className="bg-bg-white">
          <RecommendTab seq={seq} lat={detail?.basic.latitude} lng={detail?.basic.longitude} />
        </div>

        <DetailFooter />
      </div>
      <Toast id={toastMsg?.id} message={toastMsg?.message ?? null} onDismiss={() => setToastMsg(null)} />
    </AnimationSheet>
  )
}

function SharedInfoCard({
  icon,
  title,
  children
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-stroke-soft flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <span className="text-text-strong text-t5 font-bold">{title}</span>
      </div>
      {children}
    </div>
  )
}

function SharedHeroPlaceholder() {
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
        <span className="text-text-soft text-b5">이미지 준비중</span>
      </div>
    </div>
  )
}
