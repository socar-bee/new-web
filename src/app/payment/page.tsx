import { Suspense } from 'react'

import type { Metadata } from 'next'

import PaymentView from './view'

export const metadata: Metadata = {
  title: '결제하기 - 모두의주차장',
  robots: { index: false }
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentView />
    </Suspense>
  )
}
