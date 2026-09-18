import { Suspense } from 'react'

import type { Metadata } from 'next'

import { AirportTicketsView } from './view'

export const metadata: Metadata = {
  title: '모두의주차장 - 공항 주차권 목록',
  description: '선택한 기간에 이용 가능한 공항 주차대행 주차권 목록입니다.'
}

export default function AirportTicketsPage() {
  return (
    <Suspense>
      <AirportTicketsView />
    </Suspense>
  )
}
