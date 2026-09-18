'use client'

/**
 * 공용 CTA 바텀시트 — 타이틀 + 본문 + 하단 확정 버튼 (modu-web-app BottomSheet 대응).
 * 딤 클릭 = onClose.
 */
export default function CtaBottomSheet({
  isOpen,
  title,
  btnText,
  btnDisabled,
  onClick,
  onClose,
  children
}: {
  isOpen: boolean
  title: string
  btnText: string
  btnDisabled?: boolean
  onClick: () => void
  onClose: () => void
  children: React.ReactNode
}) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-[60] mx-auto flex w-full max-w-[480px] flex-col justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-bg-white flex flex-col rounded-t-2xl px-5 pt-6 pb-[max(env(safe-area-inset-bottom),20px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-t4 text-text-strong pb-2 font-bold">{title}</h3>
        {children}
        <button
          type="button"
          disabled={btnDisabled}
          onClick={onClick}
          className="bg-primary text-static-white text-t5 mt-4 h-[52px] w-full cursor-pointer rounded-lg font-semibold disabled:opacity-40"
        >
          {btnText}
        </button>
      </div>
    </div>
  )
}
