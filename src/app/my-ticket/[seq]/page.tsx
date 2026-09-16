import { Suspense } from 'react'

import type { Metadata } from 'next'

import MyTicketDetailView from './view'

export const metadata: Metadata = {
  title: '모두의주차장 - 내 주차권',
  description: '결제한 주차권의 유효 시간, 입차예정시간, 가격, 주차장 정보를 확인할 수 있습니다.'
}

interface PageProps {
  params: Promise<{ seq: string }>
}

export default async function MyTicketDetailPage({ params }: PageProps) {
  const { seq } = await params
  return (
    <Suspense>
      <MyTicketDetailView seq={seq} />
    </Suspense>
  )
}
