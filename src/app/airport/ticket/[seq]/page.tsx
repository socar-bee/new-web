import { Suspense } from 'react'

import type { Metadata } from 'next'

import { AirportTicketDetailView } from './view'

export const metadata: Metadata = {
  title: '모두의주차장 - 공항 주차권 상세',
  description: '공항 주차대행 주차권의 가격, 이용 기간, 유의사항을 확인하고 예매할 수 있습니다.'
}

interface PageProps {
  params: Promise<{ seq: string }>
}

export default async function AirportTicketDetailPage({ params }: PageProps) {
  const { seq } = await params
  return (
    <Suspense>
      <AirportTicketDetailView seq={seq} />
    </Suspense>
  )
}
