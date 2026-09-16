'use client'

import { IconChevronRightLine, IconXLine } from '@socar-inc/modu-ui/icons'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/pagination'

import {
  getMillisecondsUntilNextKstDay,
  isDismissedForSession,
  isDismissedToday,
  saveDismissedForSession,
  saveDismissedToday
} from '@/shared/lib/todayDismissal'

interface BaseEventBannerSlide {
  image: string
  alt: string
}

export interface ImageEventBannerSlide extends BaseEventBannerSlide {
  variant?: 'image'
  href?: string
}

export interface PromotionEventBannerSlide extends BaseEventBannerSlide {
  variant: 'promotion'
  title: string
  subtitle: string
  actionLabel: string
  href: string | null
}

export type EventBannerSlide = ImageEventBannerSlide | PromotionEventBannerSlide

interface EventBannerProps {
  slides: EventBannerSlide[]
  onSlideClick?: (slide: EventBannerSlide, index: number) => void
  onClose?: () => void
  onDismiss?: () => void
  /** "오늘 하루 보지 않기" localStorage 키 — KST 자정에 재노출 */
  todayDismissKey: string
  todayDismissLabel?: string
}

type DailyDismissalStatus = 'checking' | 'visible' | 'dismissed'

const PromotionSlideContent = ({ slide }: { slide: PromotionEventBannerSlide }) => {
  const actionClassName =
    'absolute left-1/2 top-[172px] z-20 flex h-9 -translate-x-1/2 items-center justify-center gap-0.5 whitespace-nowrap rounded-[6px] bg-neutral-950 px-2.5 py-2 text-white'
  const actionContent = (
    <>
      <span className="text-t5 font-semibold">{slide.actionLabel}</span>
      <IconChevronRightLine className="size-5" />
    </>
  )

  return (
    <>
      <div className="absolute top-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-4 text-center whitespace-nowrap text-white">
        <h2 className="text-h1 font-extrabold whitespace-pre">{slide.title}</h2>
        <p className="text-b1 font-normal">{slide.subtitle}</p>
      </div>

      {slide.href ? (
        <span className={actionClassName}>{actionContent}</span>
      ) : (
        <button type="button" disabled aria-disabled="true" className={actionClassName}>
          {actionContent}
        </button>
      )}

      <div className="pointer-events-none absolute top-[215px] -left-4 h-[234px] w-[350px] overflow-hidden">
        <Image src={slide.image} alt={slide.alt} fill sizes="350px" className="object-cover" priority unoptimized />
      </div>
    </>
  )
}

/**
 * 메인 이벤트 팝업 — modu-web-app `EventBanner` 이관 (2026-09-16).
 * dim 오버레이 + Swiper(Pagination) 카드 + "오늘 하루 보지 않기".
 * promotion variant: brand 카드(343×430) 안 타이틀·CTA·이미지, 우상단 X.
 * 닫기(X)·슬라이드 클릭은 세션 억제, "오늘 하루 보지 않기"는 KST 오늘까지 억제.
 */
export default function EventBanner({
  slides,
  onSlideClick,
  onClose,
  onDismiss,
  todayDismissKey,
  todayDismissLabel = '오늘 하루 보지 않기'
}: EventBannerProps) {
  const [dailyDismissalStatus, setDailyDismissalStatus] = useState<DailyDismissalStatus>('checking')

  useEffect(() => {
    let nextKstDayTimer: number | undefined
    const syncDailyDismissalStatus = () => {
      const isDismissed = isDismissedToday(todayDismissKey) || isDismissedForSession(todayDismissKey)
      // 마운트 후 스토리지 판정 — hydration 안전 패턴의 의도적 예외

      setDailyDismissalStatus(isDismissed ? 'dismissed' : 'visible')
      nextKstDayTimer = window.setTimeout(syncDailyDismissalStatus, Math.max(getMillisecondsUntilNextKstDay(), 1))
    }

    syncDailyDismissalStatus()
    return () => {
      if (nextKstDayTimer !== undefined) window.clearTimeout(nextKstDayTimer)
    }
  }, [todayDismissKey])

  const handleDismiss = useCallback(() => {
    saveDismissedToday(todayDismissKey)
    setDailyDismissalStatus('dismissed')
    onDismiss?.()
  }, [onDismiss, todayDismissKey])

  const handleSlideClick = useCallback(
    (slide: EventBannerSlide, index: number) => {
      onSlideClick?.(slide, index)
      saveDismissedForSession(todayDismissKey)
      setDailyDismissalStatus('dismissed')
    },
    [onSlideClick, todayDismissKey]
  )

  const handleClose = useCallback(() => {
    saveDismissedForSession(todayDismissKey)
    setDailyDismissalStatus('dismissed')
    onClose?.()
  }, [onClose, todayDismissKey])

  const isClosed = dailyDismissalStatus !== 'visible'
  const isPromotionBanner = slides[0]?.variant === 'promotion'

  if (slides.length === 0 || isClosed) return null

  return (
    <AnimatePresence>
      {!isClosed && (
        <motion.div
          className="fixed inset-0 z-[var(--z-modal,500)] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`absolute inset-0 ${isPromotionBanner ? 'bg-black/60' : 'bg-black/40'}`} />

          <div
            className={`relative flex w-full flex-col items-center ${isPromotionBanner ? 'translate-y-[26px] gap-2' : 'gap-4'}`}
          >
            <div
              className={`relative overflow-hidden ${
                isPromotionBanner
                  ? 'bg-brand-700 h-[430px] w-[343px] max-w-[calc(100vw-32px)] rounded-[8px]'
                  : 'h-[394px] w-[288px] rounded-[27px]'
              }`}
            >
              <Swiper
                modules={[Pagination]}
                pagination={slides.length > 1 ? { clickable: true } : false}
                loop={slides.length > 1}
                className="size-full [&_.swiper-pagination-bullet]:bg-white/40 [&_.swiper-pagination-bullet-active]:bg-white"
              >
                {slides.map((slide, i) => (
                  <SwiperSlide key={`${slide.image}-${i}`}>
                    {slide.variant === 'promotion' ? (
                      <div className="bg-brand-700 relative size-full overflow-hidden">
                        {slide.href ? (
                          <a
                            href={slide.href}
                            target="_self"
                            aria-label={slide.actionLabel}
                            className="relative block size-full cursor-pointer"
                            onClick={() => handleSlideClick(slide, i)}
                          >
                            <PromotionSlideContent slide={slide} />
                          </a>
                        ) : (
                          <PromotionSlideContent slide={slide} />
                        )}

                        <button
                          type="button"
                          aria-label="닫기"
                          className="absolute top-4 right-4 z-20 flex size-6 cursor-pointer items-center justify-center text-white"
                          onClick={handleClose}
                        >
                          <IconXLine className="size-6" />
                        </button>
                      </div>
                    ) : slide.href ? (
                      <Link
                        href={slide.href}
                        aria-label={slide.alt}
                        className="relative block size-full cursor-pointer"
                        onClick={() => handleSlideClick(slide, i)}
                      >
                        <Image src={slide.image} alt={slide.alt} fill className="object-cover" priority />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        aria-label={slide.alt}
                        className="relative block size-full cursor-pointer"
                        onClick={() => handleSlideClick(slide, i)}
                      >
                        <Image src={slide.image} alt={slide.alt} fill className="object-cover" priority />
                      </button>
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <button
              type="button"
              aria-label={todayDismissLabel}
              className={`flex cursor-pointer items-center ${
                isPromotionBanner
                  ? 'h-[26px] rounded-[6px] px-2 py-1 text-white'
                  : 'rounded-full bg-black/45 px-4 py-[10px]'
              }`}
              onClick={handleDismiss}
            >
              <span className={isPromotionBanner ? 'text-t6 font-semibold' : 'text-c2 font-medium text-white'}>
                {todayDismissLabel}
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
