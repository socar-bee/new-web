'use client'

import Lottie from 'lottie-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import reviewDockIntro from '@/shared/assets/lottie/reviewDockIntro.json'

const REVIEW_INTRO_STORAGE_KEY = 'modu_dock_review_intro_seen'

type NavItem = {
  label: string
  href: string
  icon?: React.ComponentType<{ active: boolean }>
  imageSrc?: string
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: '홈', href: '/', imageSrc: '/images/dock_home.webp' },
  { label: '혜택', href: '/benefit', imageSrc: '/images/icn_together.webp' },
  { label: '내 주변', href: '/map', imageSrc: '/images/dock_map_pin.webp' },
  { label: '내 주차권', href: '/tickets', imageSrc: '/images/dock_tickets.webp' },
  { label: 'MY', href: '/my', imageSrc: '/images/dock_my.webp' }
] as const

export default function DockBar() {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)
  const [showReviewIntro, setShowReviewIntro] = useState(false)

  // localStorage는 클라이언트에서만 접근 가능 → 마운트 후 판정해 hydration mismatch 회피
  useEffect(() => {
    if (localStorage.getItem(REVIEW_INTRO_STORAGE_KEY) === '1') return
    localStorage.setItem(REVIEW_INTRO_STORAGE_KEY, '1')
    // 마운트 직후 1회만 인트로 활성화 — 외부 의존성 없는 일회성 동기화이므로 의도적 예외
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowReviewIntro(true)
  }, [])

  // 시트/오버레이에서 참조할 수 있도록 dock 높이를 :root CSS 변수로 노출
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const update = () => {
      const h = el.getBoundingClientRect().height
      document.documentElement.style.setProperty('--dock-height', `${h}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--dock-height')
    }
  }, [])

  const handleClick = (item: (typeof NAV_ITEMS)[number]) => {
    router.push(item.href)
  }

  const handleReviewIntroComplete = () => {
    setShowReviewIntro(false)
  }

  return (
    <nav
      ref={navRef}
      // 앱 웹뷰에서는 네이티브 탭이 있어 숨긴다 (html[data-platform='app'] [data-web-only])
      data-web-only
      className="border-stroke-soft bg-bg-white relative z-[var(--z-dock)] mx-auto w-full max-w-[480px] shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around py-2.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          const showLottie = item.href === '/reviews' && showReviewIntro
          return (
            <button
              key={item.href}
              onClick={() => handleClick(item)}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              {showLottie ? (
                <span className="flex size-6 items-center justify-center" aria-hidden="true">
                  <Lottie
                    animationData={reviewDockIntro}
                    loop={false}
                    autoplay
                    style={{ width: 24, height: 24 }}
                    onComplete={handleReviewIntroComplete}
                  />
                </span>
              ) : item.imageSrc ? (
                <span
                  className={`flex size-6 items-center justify-center transition-[filter,opacity] ${
                    isActive ? '' : 'opacity-60 grayscale'
                  }`}
                  aria-hidden="true"
                >
                  <Image src={item.imageSrc} alt="" width={24} height={24} className="object-contain" priority />
                </span>
              ) : Icon ? (
                <Icon active={isActive} />
              ) : null}
              <span className={`text-c4 ${isActive ? 'text-primary font-medium' : 'text-neutral-900'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
