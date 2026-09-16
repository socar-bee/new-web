import { Suspense } from 'react'

import type { Metadata } from 'next'

import BenefitView from './view'

export const metadata: Metadata = {
  title: '혜택 - 모두의주차장',
  description: '모두의주차장 포인트 미션과 제휴 혜택을 한 곳에서 확인하세요'
}

export default function BenefitPage() {
  // useSearchParams(로그인 복귀 raffle=continue)를 쓰는 클라이언트 뷰 — Suspense 필수
  return (
    <Suspense>
      <BenefitView />
    </Suspense>
  )
}
