'use client'

import { IconXLine } from '@socar-inc/modu-ui/icons'
import { useEffect, useState } from 'react'
import { Autoplay } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

import type { HeroBanner } from '../model'

/** 세션 동안 배너 숨김 — modu-web-app SlideBanner 의 닫기 동작과 동일 시맨틱 */
const BANNER_CLOSED_KEY = 'modu_home_banner_closed'

/**
 * 홈 배너 슬라이더 — modu-web-app `SlideBanner`(맵 하단 배너)와 동일 구현:
 * Swiper + Autoplay(4000ms, 인터랙션 후에도 유지) + loop, rounded-[8px], 우측 닫기(X).
 * 슬라이드 데이터는 서버 배너(/user/config/banner) 우선, 없으면 정적 fallback.
 */
export default function HomeBannerSlider({
  banners,
  onClickBanner
}: {
  banners: HeroBanner[]
  onClickBanner: (banner: HeroBanner) => void
}) {
  const [isClosed, setIsClosed] = useState(false)

  // sessionStorage 는 마운트 후에만 읽는다 (hydration 안전 패턴) — 1회성 동기화라 의도적 예외
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(BANNER_CLOSED_KEY) === '1') setIsClosed(true)
    } catch {
      /* 접근 불가 시 그냥 노출 */
    }
  }, [])

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsClosed(true)
    try {
      sessionStorage.setItem(BANNER_CLOSED_KEY, '1')
    } catch {
      /* 저장 실패 시 이번 렌더에서만 숨김 */
    }
  }

  if (isClosed) return null

  if (!banners.length) {
    return (
      <div className="px-5">
        <div className="bg-bg-soft h-[180px] animate-pulse rounded-[8px]" />
      </div>
    )
  }

  const hasMultipleSlides = banners.length > 1
  // 서버 배너는 첫 배너의 가로/세로 비율로 높이를 통일 (modu-android 동일), 없으면 180px
  const heroRatio = banners[0]?.ratio

  return (
    <div className="relative px-5">
      <Swiper
        modules={hasMultipleSlides ? [Autoplay] : []}
        autoplay={hasMultipleSlides ? { delay: 4000, disableOnInteraction: false } : false}
        loop={hasMultipleSlides}
        allowTouchMove={hasMultipleSlides}
        className="overflow-hidden rounded-[8px]"
      >
        {banners.map((b) => (
          <SwiperSlide key={b.id}>
            <div
              className={`w-full ${b.href ? 'cursor-pointer' : ''}`}
              onClick={() => onClickBanner(b)}
              role={b.href ? 'link' : undefined}
            >
              {b.image ? (
                <div
                  className={`relative overflow-hidden ${heroRatio ? '' : 'h-[180px]'}`}
                  style={{ background: 'var(--color-brand-50)', ...(heroRatio ? { aspectRatio: heroRatio } : {}) }}
                >
                  <img
                    src={b.image}
                    alt={b.title}
                    draggable={false}
                    className={`h-full w-full select-none ${heroRatio ? 'object-cover' : 'object-contain'}`}
                  />
                </div>
              ) : (
                <div
                  className="relative flex h-[180px] flex-col justify-between overflow-hidden p-5"
                  style={{ background: b.background }}
                >
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-h4 font-extrabold whitespace-pre-line text-white">{b.title}</h2>
                    {b.subtitle && <p className="text-c2 font-medium text-white/85">{b.subtitle}</p>}
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
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 닫기 — modu-web-app SlideBanner 와 동일하게 우측 세로 중앙 */}
      <button
        type="button"
        aria-label="배너 닫기"
        onClick={handleClose}
        className="absolute top-1/2 right-7 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
      >
        <IconXLine className="size-3.5" />
      </button>
    </div>
  )
}
