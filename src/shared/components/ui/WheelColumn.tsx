'use client'

import { useEffect, useRef } from 'react'

const ITEM_HEIGHT = 40
const VISIBLE_COUNT = 5

/**
 * 휠 피커 한 컬럼 — scroll-snap 기반 (modu-web-app WheelDateTimePicker 대응).
 * 가운데 줄이 선택 값이며, 스크롤이 멈추면 onChange 로 인덱스를 알린다.
 */
export default function WheelColumn({
  options,
  selectedIndex,
  onChange,
  ariaLabel
}: {
  options: string[]
  selectedIndex: number
  onChange: (index: number) => void
  ariaLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 외부 selectedIndex 변경(초기화 포함) 시 스크롤 동기화
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = selectedIndex * ITEM_HEIGHT
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target
  }, [selectedIndex, options])

  const handleScroll = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const index = Math.max(0, Math.min(options.length - 1, Math.round(el.scrollTop / ITEM_HEIGHT)))
      if (index !== selectedIndex) onChange(index)
    }, 80)
  }

  const pad = (VISIBLE_COUNT - 1) / 2

  return (
    <div className="relative min-w-0 flex-1" style={{ height: ITEM_HEIGHT * VISIBLE_COUNT }}>
      {/* 가운데 선택 라인 */}
      <div
        className="bg-bg-weak pointer-events-none absolute inset-x-0 rounded-lg"
        style={{ top: ITEM_HEIGHT * pad, height: ITEM_HEIGHT }}
      />
      <div
        ref={ref}
        role="listbox"
        aria-label={ariaLabel}
        onScroll={handleScroll}
        className="scrollbar-hide relative h-full snap-y snap-mandatory overflow-y-auto"
      >
        <div style={{ height: ITEM_HEIGHT * pad }} />
        {options.map((option, i) => (
          <button
            key={`${option}-${i}`}
            type="button"
            role="option"
            aria-selected={i === selectedIndex}
            onClick={() => onChange(i)}
            className={`flex w-full snap-center items-center justify-center text-[16px] ${
              i === selectedIndex ? 'text-text-strong font-semibold' : 'text-text-soft'
            }`}
            style={{ height: ITEM_HEIGHT }}
          >
            {option}
          </button>
        ))}
        <div style={{ height: ITEM_HEIGHT * pad }} />
      </div>
    </div>
  )
}
