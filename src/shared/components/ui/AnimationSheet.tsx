'use client'

import { AnimatePresence, motion, type PanInfo, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type SheetSnap = 'peek' | 'half' | 'full'

interface AnimationSheetProps {
  /** 시트 열림 여부 (false면 화면 밖으로 닫힘) */
  isOpen: boolean
  /** 현재 snap 상태 */
  snap: SheetSnap
  /** snap 전환 콜백 (드래그/클릭 등 내부 인터랙션으로 변경 시 호출) */
  onSnapChange: (snap: SheetSnap) => void
  /** 백드롭 클릭 or 시트 peek 아래로 드래그 시 호출 */
  onClose?: () => void
  /** peek 상태 노출 높이(px) */
  peekHeight?: number
  /** half 상태가 뷰포트에서 차지하는 비율 (0~1) */
  halfRatio?: number
  /** peek bar — 모든 snap에서 시트 최상단에 고정 노출 */
  peek: React.ReactNode
  /** full 상태일 때 peek 위로 올라오는 navigation bar (뒤로가기 등). full이 아닐 땐 숨김 */
  navigationBar?: React.ReactNode
  /** 본문 (스크롤 가능). full 상태에서만 스크롤 활성화 */
  children: React.ReactNode
  /** 스크롤 영역 위에 고정 오버레이 (예: 지도보기 플로팅 버튼). full 상태에서만 노출 */
  overlay?: React.ReactNode
  /** true면 마운트 시 슬라이드업 애니메이션 생략 (예: hash로 #sheet=full 진입) */
  skipMountAnimation?: boolean
}

// iOS 계열 바텀시트 느낌: critical damping(ratio=1.0)로 튕김 없이 타이트하게 정착
// ζ = damping / (2 * sqrt(stiffness * mass)) = 40 / (2 * sqrt(400)) = 1.0
const SPRING = { type: 'spring' as const, damping: 40, stiffness: 400, mass: 1 }
const VELOCITY_THRESHOLD = 300
// 드래그 offset이 이 값만 넘어도 방향성 있는 의도로 판단 → 인접 snap으로 즉시 commit
const COMMIT_OFFSET = 20

/**
 * framer-motion 기반 3-snap 바텀시트.
 * - peek: 고정 높이만 노출 (지도 인터랙션 유지, 백드롭 없음)
 * - half: 뷰포트 비율만큼 노출 (백드롭 dim 시작)
 * - full: 전체 노출 (navigationBar 올라옴, 백드롭 최대)
 */
export default function AnimationSheet({
  isOpen,
  snap,
  onSnapChange,
  onClose,
  peekHeight = 92,
  halfRatio = 0.45,
  peek,
  navigationBar,
  children,
  overlay,
  skipMountAnimation = false
}: AnimationSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const peekSectionRef = useRef<HTMLDivElement>(null)
  // dragListener=false + 수동 start → 드래그 진입점을 상단(peek/navBar) 영역에만 부여.
  // body(스크롤 영역)에서 시작된 포인터는 시트 드래그로 오인되지 않음.
  const dragControls = useDragControls()
  // SSR/CSR 동일한 초기값으로 시작해 hydration mismatch 방지.
  // mount 후 useEffect에서 실제 뷰포트 높이로 업데이트되면 framer-motion이 애니메이션.
  const y = useMotionValue(9999)
  const [vh, setVh] = useState(0)
  const [bottomOffset, setBottomOffset] = useState(0)
  // 실제 peek 섹션(handle + peek bar)의 렌더링 높이. peekHeight prop은 fallback으로만 사용.
  const [measuredPeekHeight, setMeasuredPeekHeight] = useState(peekHeight)

  /** 시트가 실제로 차지할 수 있는 세로 영역 (viewport - dock) */
  const sheetHeight = Math.max(vh - bottomOffset, 0)

  /** snap → y(px) 매핑. 시트 자체 높이는 sheetHeight. dock 영역은 항상 비워둠. */
  const getSnapY = useCallback(
    (target: SheetSnap) => {
      if (target === 'full') return 0
      if (target === 'half') return Math.round(sheetHeight * (1 - halfRatio))
      return Math.max(sheetHeight - measuredPeekHeight, 0)
    },
    [halfRatio, measuredPeekHeight, sheetHeight]
  )

  // 뷰포트 높이 초기화 및 리사이즈 대응
  useEffect(() => {
    const update = () => setVh(window.innerHeight)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // DockBar가 :root에 셋해주는 --dock-height를 읽어서 시트 바닥 여백으로 사용
  useEffect(() => {
    const read = () => {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--dock-height').trim()
      const num = parseFloat(val)
      setBottomOffset(Number.isFinite(num) ? num : 0)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    window.addEventListener('resize', read)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', read)
    }
  }, [])

  // peek 섹션의 실제 렌더링 높이를 측정 → peek 상태에서 body가 새어나오지 않도록 정확히 잘라냄
  useEffect(() => {
    const el = peekSectionRef.current
    if (!el) return
    const update = () => {
      const h = el.getBoundingClientRect().height
      if (h > 0) setMeasuredPeekHeight(h)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 백드롭 투명도: peek→half 구간에서 0 → 0.3, half→full 구간에서 0.3 → 0.5
  const backdropOpacity = useTransform(y, () => {
    if (vh === 0) return 0
    const peekY = getSnapY('peek')
    const halfY = getSnapY('half')
    const current = y.get()
    if (current >= peekY) return 0
    if (current >= halfY) {
      const ratio = (peekY - current) / Math.max(peekY - halfY, 1)
      return ratio * 0.3
    }
    const ratio = (halfY - current) / Math.max(halfY, 1)
    return 0.3 + ratio * 0.2
  })

  const snapTargets = useMemo<SheetSnap[]>(() => ['peek', 'half', 'full'], [])

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const currentY = y.get()
      const velocity = info.velocity.y
      const offset = info.offset.y
      const currentIdx = snapTargets.indexOf(snap)

      // peek에서 아래로 충분히 끌어내렸으면 close
      if (snap === 'peek' && offset > measuredPeekHeight * 0.5 && onClose) {
        onClose()
        return
      }

      // 방향성 있는 의도 감지: 작은 offset 또는 살짝의 velocity만 있어도 인접 snap으로 commit
      // ("드드드드드" 느낌 제거 — 원점 복귀 대신 딱딱 다음 snap으로 떨어지게)
      const hasDirectionalIntent = Math.abs(offset) > COMMIT_OFFSET || Math.abs(velocity) > VELOCITY_THRESHOLD

      if (hasDirectionalIntent) {
        // 방향 결정: offset 우선, tie일 땐 velocity
        const goingDown = Math.abs(offset) > COMMIT_OFFSET ? offset > 0 : velocity > 0
        if (goingDown) {
          if (currentIdx === 0) {
            onClose?.()
          } else {
            onSnapChange(snapTargets[currentIdx - 1])
          }
        } else if (currentIdx < snapTargets.length - 1) {
          onSnapChange(snapTargets[currentIdx + 1])
        } else {
          onSnapChange(snap)
        }
        return
      }

      // 의도가 모호한 미세한 떨림 → 거리 기반으로 가장 가까운 snap으로 복귀
      let closest: SheetSnap = snap
      let minDist = Infinity
      for (const target of snapTargets) {
        const dist = Math.abs(currentY - getSnapY(target))
        if (dist < minDist) {
          minDist = dist
          closest = target
        }
      }
      onSnapChange(closest)
    },
    [getSnapY, measuredPeekHeight, onClose, onSnapChange, snap, snapTargets, y]
  )

  // vh=0이면 뷰포트 크기를 아직 모르는 것 → 화면 밖(9999)에 고정. mount 후 vh가 설정되면 올바른 위치로 애니메이션.
  const targetY = vh === 0 ? 9999 : isOpen ? getSnapY(snap) : vh

  // skipMountAnimation: 첫 frame은 transition: 0으로 즉시 정착시키고, 이후엔 정상 SPRING 복귀
  const [skipFirstTransition, setSkipFirstTransition] = useState(skipMountAnimation)
  useEffect(() => {
    if (!skipFirstTransition) return
    if (vh === 0) return // vh가 결정된 직후 첫 paint를 instant로 → 다음 tick에 SPRING으로 전환
    const t = setTimeout(() => setSkipFirstTransition(false), 50)
    return () => clearTimeout(t)
  }, [skipFirstTransition, vh])

  return (
    <>
      {/* Backdrop — 앱 프레임(480px) 내부에서만 dim. dock 영역은 dim 제외 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-backdrop)] mx-auto w-full max-w-[480px]"
            style={{ bottom: bottomOffset }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black"
              style={{
                opacity: backdropOpacity,
                pointerEvents: snap === 'peek' ? 'none' : 'auto'
              }}
              onClick={() => {
                if (snap === 'full') onSnapChange('half')
                else if (snap === 'half') onSnapChange('peek')
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/*
       * 클리핑 컨테이너
       * - dock 영역(bottom: bottomOffset)은 항상 비움 → dock 클릭 가능
       * - overflow-hidden으로 시트가 dock 영역 밖을 렌더링/히트테스트 하지 못하게 차단
       * - pointer-events-none 이라 빈 영역(위쪽 맵 부분)은 클릭이 맵으로 통과
       */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-sheet)] mx-auto w-full max-w-[480px] overflow-hidden"
        style={{ bottom: bottomOffset }}
      >
        <motion.div
          ref={sheetRef}
          className="bg-bg-white pointer-events-auto absolute inset-x-0 top-0 flex flex-col rounded-t-[20px] shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
          // height=sheetHeight → dock 높이 제외. 본문 flex 레이아웃이 dock 위 영역 안에 맞게 분배됨.
          style={{ y, height: sheetHeight || '100dvh' }}
          animate={{ y: targetY }}
          transition={skipFirstTransition ? { duration: 0 } : SPRING}
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: sheetHeight }}
          dragElastic={{ top: 0.05, bottom: 0.2 }}
          onDragEnd={handleDragEnd}
        >
          {/* Navigation bar (full 전용) — drag 진입점 */}
          <AnimatePresence initial={false}>
            {snap === 'full' && navigationBar && (
              <motion.div
                key="nav"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                {navigationBar}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Peek section — drag 진입점. 실제 렌더링 높이를 측정해서 peek 상태에서 정확히 잘라냄 */}
          <div ref={peekSectionRef} className="shrink-0 touch-none" onPointerDown={(e) => dragControls.start(e)}>
            {/* Handle — peek/half 상태에서만 노출, full 상태에서는 navigationBar가 대체 */}
            {snap !== 'full' && (
              <div className="flex justify-center pt-2 pb-1">
                <span className="block h-1 w-9 rounded-full bg-neutral-300" />
              </div>
            )}
            {peek}
          </div>

          {/* Body — full 상태에서만 스크롤 활성화.
           *   - full:  overflow-y: auto + touch-action: pan-y → 본문 스크롤. 드래그 트리거 없음 → 탭 콘텐츠 스크롤이 시트 이동으로 오인되지 않음.
           *   - peek/half: overflow-y: hidden + touch-action: none → 스크롤 없음. 본문에서 시작된 포인터도 드래그로 연결. */}
          <div
            ref={bodyRef}
            data-sheet-scroll-body
            className="scrollbar-hide min-h-0 flex-1"
            style={{
              overflowY: snap === 'full' ? 'auto' : 'hidden',
              touchAction: snap === 'full' ? 'pan-y' : 'none'
            }}
            onPointerDown={(e) => {
              if (snap !== 'full') dragControls.start(e)
            }}
          >
            {children}
          </div>

          {/* Overlay — 스크롤 영역 위에 고정. full 상태에서만 노출.
           *   z-20: 본문 안 sticky 탭(z-10)보다 높여 어떤 스크롤 위치에서도 가려지지 않게 */}
          {snap === 'full' && overlay && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">{overlay}</div>
          )}
        </motion.div>
      </div>
    </>
  )
}
