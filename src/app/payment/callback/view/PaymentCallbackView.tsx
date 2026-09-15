'use client'

import { MText } from '@socar-inc/modu-ui/components'

import { usePaymentCallbackViewModel } from '../viewmodel'

/** 결제 결과 처리 중 — 판별·이동은 viewmodel 이 한다 (표시 전용) */
export default function PaymentCallbackView() {
  usePaymentCallbackViewModel()

  return (
    <div className="bg-bg-white flex h-full items-center justify-center">
      <MText typography="body_b4" color="text_soft_400">
        결제 결과를 확인하고 있어요…
      </MText>
    </div>
  )
}
