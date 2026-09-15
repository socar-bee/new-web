import { useQuery } from '@tanstack/react-query'

import { fetchPointBalance } from './api'

export const paymentQueryKeys = {
  all: ['payment'] as const,
  pointBalance: (accessToken?: string | null) => [...paymentQueryKeys.all, 'pointBalance', accessToken ?? ''] as const
}

/**
 * 충전금 잔액 — 인증 수단이 있을 때만 조회한다.
 * 실패(비로그인·구버전 앱)는 0 으로 그린다 — 결제 화면 진입 자체는 막지 않는다.
 */
export function usePointBalance(options: { enabled: boolean; accessToken?: string | null }) {
  return useQuery<number>({
    queryKey: paymentQueryKeys.pointBalance(options.accessToken),
    queryFn: () => fetchPointBalance(options.accessToken),
    enabled: options.enabled,
    staleTime: 30_000,
    retry: 0
  })
}
