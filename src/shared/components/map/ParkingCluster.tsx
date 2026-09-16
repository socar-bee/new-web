'use client'

interface ParkingClusterProps {
  count: number
}

/**
 * 주차장 클러스터 마커 — 40px CSS 원.
 * SVG mask-stroke(피그마 export 핵)는 소형에서 보더가 자글거리고, mask id 가
 * count 기준이라 같은 수의 클러스터가 여럿이면 id 충돌로 렌더가 깨졌다 → CSS 로 교체.
 */
export default function ParkingCluster({ count }: ParkingClusterProps) {
  return (
    <div className="relative size-10">
      {/* Ping animation */}
      <div
        className="bg-brand-700 absolute inset-1 animate-ping rounded-full opacity-[0.12]"
        style={{ animationDuration: '2.5s' }}
      />
      {/* 원 본체 */}
      <div
        className="border-brand-800 bg-brand-700 absolute inset-0 flex items-center justify-center rounded-full border-2"
        style={{ boxShadow: '0 2px 6px rgba(14, 18, 27, 0.25)' }}
      >
        <span className="text-t4 leading-none font-bold text-white">{count}</span>
      </div>
    </div>
  )
}
