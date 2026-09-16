'use client'

import { MButton, MIcon, MText } from '@socar-inc/modu-ui/components'
import { IconCautionFill, IconConfirmFill } from '@socar-inc/modu-ui/icons'

import { usePurchaseResultViewModel } from '../viewmodel'

/** 결제 결과 — pay 비회원(guest-pay) 결제 복귀 화면 (성공/실패) */
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
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <MIcon icon={IconConfirmFill} size={56} decorative className="text-primary" />
        <div className="flex flex-col items-center gap-1.5">
          <MText typography="title_t2" color="text_strong_950">
            결제가 완료되었어요
          </MText>
          <MText typography="body_b4" color="text_sub_600" className="text-center">
            구매하신 주차권은 결제 시 인증한 휴대폰 번호로
            <br />
            확인할 수 있어요
          </MText>
        </div>
      </main>

      <footer className="flex flex-col gap-2 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {vm.couponSeq && (
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
