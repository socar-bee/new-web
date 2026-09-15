import { Suspense } from 'react'

import type { Metadata } from 'next'

import PaymentCallbackView from './view'

export const metadata: Metadata = {
  title: '결제 처리 중 - 모두의주차장',
  robots: { index: false }
}

export default function PaymentCallbackPage() {
  return (
    <Suspense>
      <PaymentCallbackView />
    </Suspense>
  )
}
