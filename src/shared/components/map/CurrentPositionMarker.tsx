'use client'

/**
 * 현재위치 버튼 클릭 시 지도에 표시되는 핀 (빨간 동그라미 + 막대 + 그림자)
 */
export default function CurrentPositionMarker() {
  return (
    <div className="translate-x-[-50%] translate-y-[-100%]">
      <div className="relative flex h-[34px] flex-col items-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15.5" y="16" width="2" height="14" fill="#525866" />
          <circle cx="16.5" cy="10.5" r="7.5" fill="#ff4c4c" />
        </svg>
      </div>
      <div className="absolute bottom-[1px] left-[10.5px] h-[6px] w-[12px]">
        <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="6" cy="3" rx="6" ry="3" fill="black" fillOpacity="0.15" />
        </svg>
      </div>
    </div>
  )
}
