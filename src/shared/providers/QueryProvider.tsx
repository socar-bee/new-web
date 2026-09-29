'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { attachAuthRetry } from '@/shared/lib/authRetry'

// 모듈 로드 시점에 1회 — 첫 조회가 나가기 전에 걸려 있어야 만료 토큰을 되살릴 수 있다
attachAuthRetry()

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1
          }
        }
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
