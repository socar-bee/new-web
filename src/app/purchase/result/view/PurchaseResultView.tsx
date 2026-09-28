'use client'

import { MButton, MIcon, MText } from '@socar-inc/modu-ui/components'
import { IconCautionFill, IconConfirmFill, IconStarFill, IconStarLine } from '@socar-inc/modu-ui/icons'

import { usePurchaseResultViewModel } from '../viewmodel'

/**
 * 결제 결과 — pay 결제웹뷰 복귀 화면 (회원 `/member/callback` · 비회원 `/guest/callback` 공통).
 * 성공 화면은 modu-android `TicketPaymentCompleteScreen` 구성이다 —
 * 체크 + 완료 문구 → 주차장명(즐겨찾기) → 상세 행 → 하단 버튼. 행 구성만 권종별로 달라진다.
 */
export default function PurchaseResultView() {
  const vm = usePurchaseResultViewModel()

  if (vm.isFail) {
    return (
      <div className="bg-bg-white flex h-full flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <MIcon icon={IconCautionFill} size={56} decorative className="text-error-base" />
          <div className="flex flex-col items-center gap-1.5">
            <MText typography="title_t2" color="text_strong_950">
              결제를 완료하지 못했어요
            </MText>
            <MText typography="body_b4" color="text_sub_600" className="text-center">
              잠시 후 다시 시도해주세요
            </MText>
          </div>
        </main>

        <footer className="flex flex-col gap-2 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <MButton size="xLarge" fullWidth onClick={vm.goRetry}>
            다시 시도하기
          </MButton>
          <MButton size="xLarge" fullWidth tone="neutral" appearance="ghost" onClick={vm.goHome}>
            홈으로
          </MButton>
        </footer>
      </div>
    )
  }

  return (
    <div className="bg-bg-white flex h-full flex-col">
      <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-10">
        {/* 헤더 — 체크 · 완료 문구 (modu-android TicketPaymentCompleteScreen 과 같은 순서) */}
        <div className="flex flex-col items-center gap-4">
          <MIcon icon={IconConfirmFill} size={56} decorative className="text-primary" />
          <div className="flex flex-col items-center gap-1.5">
            <MText typography="title_t2" color="text_strong_950">
              결제가 완료되었어요
            </MText>
            <MText typography="body_b4" color="text_sub_600" className="text-center">
              {vm.purchasedSeq
                ? '구매하신 주차권은 내 주차권에서 확인할 수 있어요'
                : '잠시 후 내 주차권에서 확인할 수 있어요'}
            </MText>
          </div>
        </div>

        {/* 주차장 · 상세 행 — 조회에 실패하면 완료 문구만 남긴다 */}
        {vm.isDetailLoading ? (
          <div className="bg-bg-soft mt-10 h-[120px] w-full animate-pulse rounded-xl" />
        ) : vm.rows.length > 0 ? (
          <div className="mt-10 flex w-full flex-col gap-4">
            <div className="border-stroke-soft w-full border-t" />

            {vm.parkinglotName && (
              <div className="flex w-full items-center gap-1.5">
                <MText typography="title_t5" color="text_strong_950" className="min-w-0 flex-1 truncate">
                  {vm.parkinglotName}
                </MText>
                {/* 즐겨찾기 — android 완료 화면의 북마크와 같은 자리 */}
                <button
                  type="button"
                  aria-label={vm.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  aria-pressed={vm.isFavorite}
                  onClick={vm.onToggleFavorite}
                  className="flex size-7 cursor-pointer items-center justify-center"
                >
                  <MIcon
                    icon={vm.isFavorite ? IconStarFill : IconStarLine}
                    size={20}
                    decorative
                    className={vm.isFavorite ? 'text-yellow-500' : 'text-icon-soft'}
                  />
                </button>
              </div>
            )}

            <dl className="flex w-full flex-col gap-2">
              {vm.rows.map((row) => (
                <div key={row.label} className="flex w-full items-start gap-4">
                  <dt className="w-[72px] shrink-0">
                    <MText typography="body_b4" color="text_sub_600">
                      {row.label}
                    </MText>
                  </dt>
                  <dd className="min-w-0 flex-1 text-right">
                    <MText typography="body_b4" color="text_strong_950">
                      {row.value}
                    </MText>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </main>

      <footer className="flex flex-col gap-2 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {vm.purchasedSeq && (
          <MButton size="xLarge" fullWidth tone="neutral" appearance="stroke" onClick={vm.goMyTicket}>
            내 주차권 확인
          </MButton>
        )}
        {!vm.purchasedSeq && vm.couponSeq && (
          <MButton size="xLarge" fullWidth tone="neutral" appearance="stroke" onClick={vm.goTicketDetail}>
            주차권 상세 보기
          </MButton>
        )}
        <MButton size="xLarge" fullWidth onClick={vm.goHome}>
          확인
        </MButton>
      </footer>
    </div>
  )
}
