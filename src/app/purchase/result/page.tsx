import { Suspense } from 'react'

import type { Metadata } from 'next'

import PurchaseResultView from './view'

export const metadata: Metadata = {
  title: '결제 완료 - 모두의주차장',
  robots: { index: false }
}

export default function PurchaseResultPage() {
  return (
    <Suspense>
      <PurchaseResultView />
    </Suspense>
  )
}
