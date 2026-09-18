import { Suspense } from 'react'

import type { Metadata } from 'next'

import { AirportSearchView } from './view'

export const metadata: Metadata = {
  title: '모두의주차장 - 공항 주차대행 예매',
  description: '공항 주변 주차대행을 예매하고 공항까지 편하게 이동하세요.'
}

export default function AirportPage() {
  return (
    <Suspense>
      <AirportSearchView />
    </Suspense>
  )
}
