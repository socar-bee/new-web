'use client'

interface LocationConsentSheetProps {
  onAllow: () => void
  onDeny: () => void
}

export default function LocationConsentSheet({ onAllow, onDeny }: LocationConsentSheetProps) {
  return (
    <div
      className="fixed inset-x-0 z-[var(--z-sheet)] mx-auto max-w-[480px]"
      style={{ bottom: 'var(--dock-height, 0px)' }}
    >
      <div className="bg-bg-white rounded-t-[20px] px-5 pt-5 pb-6 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
        <h2 className="text-text-strong text-t4 mb-1 font-bold">위치 정보 이용 동의</h2>
        <p className="text-text-sub text-b4 mb-4">내 주변 주차장을 찾기 위해 현재 위치 정보가 필요합니다.</p>
        <div className="flex gap-2">
          <button
            onClick={onDeny}
            className="border-stroke-soft text-text-sub text-c2 h-11 flex-1 rounded-xl border font-medium"
          >
            사용 안 함
          </button>
          <button onClick={onAllow} className="bg-primary text-static-white text-t5 h-11 flex-[2] rounded-xl font-bold">
            현재 위치 사용
          </button>
        </div>
      </div>
    </div>
  )
}
