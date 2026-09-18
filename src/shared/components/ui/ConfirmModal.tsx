'use client'

/**
 * 공용 확인 모달 — 제목·본문·2버튼.
 * onClose = 좌측(보조) 버튼, onConfirm = 우측(주) 버튼.
 */
export default function ConfirmModal({
  title,
  body,
  confirmLabel,
  cancelLabel = '닫기',
  isBusy,
  onConfirm,
  onClose
}: {
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  isBusy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[90] mx-auto flex w-full max-w-[480px] items-center justify-center bg-black/50 px-8">
      <div className="bg-bg-white flex w-full flex-col gap-5 rounded-2xl p-5 pt-7">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-t4 text-text-strong font-bold">{title}</p>
          <p className="text-text-sub text-b4 whitespace-pre-line">{body}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-bg-soft text-text-strong text-t5 h-12 flex-1 cursor-pointer rounded-lg font-semibold"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="bg-primary text-static-white text-t5 h-12 flex-1 cursor-pointer rounded-lg font-semibold disabled:opacity-40"
          >
            {isBusy ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
